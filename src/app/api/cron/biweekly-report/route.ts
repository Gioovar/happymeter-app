
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import Twilio from 'twilio';
import crypto from 'crypto';
import { getPublicSurveyAnalytics } from '@/actions/analytics';
import { subDays } from 'date-fns';

// Initialize Clients
const resend = new Resend(process.env.RESEND_API_KEY);
let twilioClient: any = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Config
const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-me";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com';

export const maxDuration = 300; // Allow 5 minutes for batch processing
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // 1. Auth Check (Cron Secret)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        }

        console.log("[BiWeeklyReport] Starting Cron Job...");

        // 2. Fetch ALL Active Surveys (Each represents a "Branch" or "Unit")
        // We filter for active surveys only
        const surveys = await prisma.survey.findMany({
            where: { isActive: true },
            include: {
                // We don't strictly need relations here, we'll resolve ownership below
            }
        });

        const results = {
            total_surveys: surveys.length,
            sent_email: 0,
            sent_sms: 0,
            errors: [] as string[]
        };

        for (const survey of surveys) {
            try {
                // 3. Resolve "Recipient Owner"
                // The survey belongs to `survey.userId`. 
                // We check if this user is a "Branch" of a "Chain".

                let targetOwnerId = survey.userId;
                let branchName = survey.title; // Default to survey title

                const chainBranch = await prisma.chainBranch.findFirst({
                    where: { branchId: survey.userId },
                    include: { chain: true }
                });

                if (chainBranch) {
                    targetOwnerId = chainBranch.chain.ownerId;
                    // If survey title is generic, maybe append Chain Name? 
                    // Usually Survey Title IS the Branch Name (e.g. "Santi Roma")
                }

                // Fetch Target Owner Details (Email, Phone)
                // We also need the "Branch User" settings for Industry/logo context if needed, 
                // but usually the Owner holds the main contact info.

                const ownerSettings = await prisma.userSettings.findUnique({
                    where: { userId: targetOwnerId }
                });

                if (!ownerSettings || !ownerSettings.isActive) continue;

                // 4. Generate Link SPECIFIC to this Survey
                // Note: We use the SURVEY ID, not 'all-userId', to be specific to this branch
                const effectiveId = survey.id;
                const token = crypto.createHmac('sha256', SECRET_KEY).update(effectiveId).digest('hex');
                const reportUrl = `${BASE_URL}/report/${encodeURIComponent(effectiveId)}?token=${token}&action=download`;

                // 5. Fetch Analytics & Critical Issue
                let criticalIssue = "Oportunidades de mejora detectadas";
                try {
                    const analytics = await getPublicSurveyAnalytics(
                        effectiveId,
                        token,
                        { from: subDays(new Date(), 15), to: new Date() },
                        ownerSettings.industry || 'restaurant',
                        true
                    );

                    if (analytics?.generatedStrategies?.length > 0) {
                        const topStrategy = analytics.generatedStrategies[0];
                        criticalIssue = topStrategy.problemDetected
                            ? topStrategy.problemDetected.replace(/["']/g, '')
                            : topStrategy.title;
                    }
                } catch (analyticsErr) {
                    // console.warn(`Analytics skip for ${survey.id}`);
                }

                // 6. Send SMS (To Owner)
                if (twilioClient && ownerSettings.phone) {
                    try {
                        const message = `📊 Hola ${ownerSettings.businessName}. Reporte de ${branchName}: "${criticalIssue}". \n\nVer aquí: ${reportUrl}`;

                        await twilioClient.messages.create({
                            body: message,
                            from: process.env.TWILIO_PHONE_NUMBER,
                            to: ownerSettings.phone
                        });
                        results.sent_sms++;
                    } catch (smsErr: any) {
                        // console.error(`SMS Fail ${targetOwnerId}:`, smsErr.message);
                    }
                }

                // 7. Send Email (To Owner)
                if (process.env.CLERK_SECRET_KEY && resend) {
                    try {
                        const response = await fetch(`https://api.clerk.com/v1/users/${targetOwnerId}`, {
                            headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
                        });

                        if (response.ok) {
                            const clerkUser = await response.json();
                            const email = clerkUser.email_addresses?.[0]?.email_address;

                            if (email) {
                                const { error } = await resend.emails.send({
                                    from: 'HappyMeter Intelligence <reports@happymeters.com>',
                                    to: email,
                                    subject: `⚠️ Reporte ${branchName}: ${criticalIssue}`,
                                    html: `
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        </head>
                                        <body style="font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; padding: 0; margin: 0;">
                                            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                                <div style="background-color: #0f1115; padding: 30px; text-align: center;">
                                                    <img src="${BASE_URL}/happymeter_logo.png" style="height: 40px;" alt="HappyMeter" />
                                                </div>
                                                <div style="padding: 40px 30px; color: #374151;">
                                                    <h1 style="color: #111827; font-size: 24px; margin-bottom: 20px;">Reporte: ${branchName}</h1>
                                                    
                                                    <p style="font-size: 16px; line-height: 1.6;">
                                                        Análisis de desempeño de los últimos 15 días para <strong>${branchName}</strong>.
                                                    </p>

                                                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                                                        <div style="color: #991b1b; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; margin-bottom: 5px;">🔴 Problema Crítico</div>
                                                        <div style="color: #7f1d1d; font-size: 18px; font-style: italic;">"${criticalIssue}"</div>
                                                    </div>

                                                    <div style="text-align: center; margin: 40px 0;">
                                                        <a href="${reportUrl}" style="background-color: #7c3aed; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">
                                                            Descargar PDF y Ver Solución
                                                        </a>
                                                    </div>
                                                </div>
                                                <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                                                    © 2026 HappyMeter Technologies Inc.
                                                </div>
                                            </div>
                                        </body>
                                        </html>
                                    `
                                });

                                if (error) {
                                    console.error(`Resend Error ${targetOwnerId}:`, error);
                                    results.errors.push(`Email Error ${targetOwnerId}: ${error.message}`);
                                } else {
                                    results.sent_email++;
                                }
                            }
                        }
                    } catch (emailErr: any) {
                        console.error(`Email Fetch Error ${targetOwnerId}:`, emailErr);
                    }
                }

            } catch (err: any) {
                console.error(`Error processing survey ${survey.id}:`, err);
                results.errors.push(`Error Survey ${survey.id}: ${err.message}`);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("[BiWeeklyReport] Cron Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

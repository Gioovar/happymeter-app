import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    console.log('[DEBUG-SERVER] Starting diagnostic...');
    const report: any = {
        timestamp: new Date().toISOString(),
        steps: [],
        errors: []
    }

    try {
        report.steps.push('Calling auth()');
        const authData = await auth();
        report.auth = { userId: authData.userId };
        report.steps.push('auth() Success');

        report.steps.push('Calling currentUser()');
        const user = await currentUser();
        report.user = { id: user?.id, email: user?.emailAddresses[0]?.emailAddress };
        report.steps.push('currentUser() Success');

        if (authData.userId) {
            report.steps.push('Querying UserSettings');
            const settings = await prisma.userSettings.findUnique({
                where: { userId: authData.userId }
            });
            report.settings = { found: !!settings, plan: settings?.plan };
            report.steps.push('UserSettings Success');

            report.steps.push('Querying TeamMember');
            const memberships = await prisma.teamMember.findMany({
                where: { userId: authData.userId }
            });
            report.memberships = { count: memberships.length };
            report.steps.push('TeamMember Success');
        }

        return NextResponse.json(report);

    } catch (error: any) {
        console.error('[DEBUG-SERVER] Critical Error:', error);
        return NextResponse.json({
            status: 'CRASHED',
            message: error.message,
            stack: error.stack,
            report
        }, { status: 500 });
    }
}

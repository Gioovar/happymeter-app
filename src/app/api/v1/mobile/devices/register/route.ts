import { NextResponse } from 'next/server';
import { verifyMobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validación del payload de entrada con Zod
const registerSchema = z.object({
    token: z.string().min(10, "El token de dispositivo debe tener al menos 10 caracteres"),
    platform: z.enum(["ios", "android"], {
        message: "La plataforma debe ser 'ios' o 'android'"
    }),
    appType: z.enum(["LOYALTY", "HOSTESS", "STAFF", "RP"], {
        message: "El tipo de app debe ser LOYALTY, HOSTESS, STAFF o RP"
    })
});

export async function POST(req: Request) {
    try {
        // 1. Validar autenticación y contexto mediante el helper centralizado
        const authResult = await verifyMobileAuth(req);
        if (!authResult.isAuthenticated) {
            return NextResponse.json(
                { error: authResult.error?.message || "No autorizado" },
                { status: authResult.error?.status || 401 }
            );
        }

        // 2. Parsear y validar el body de la petición
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json(
                { error: "Cuerpo de petición JSON inválido o vacío" },
                { status: 400 }
            );
        }

        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { 
                    error: "Datos de registro inválidos", 
                    details: parsed.error.flatten().fieldErrors 
                },
                { status: 400 }
            );
        }

        const { token, platform, appType } = parsed.data;

        // Normalización de valores para consistencia con esquemas existentes
        const dbPlatform = platform === "ios" ? "iOS" : "Android";

        // Verificar existencia de llaves foráneas para evitar violaciones de integridad referencial
        let userId = authResult.userId || null;
        let memberId = authResult.memberId || null;

        if (userId) {
            const userExists = await prisma.userSettings.findUnique({
                where: { userId }
            });
            if (!userExists) {
                userId = null;
            }
        }

        if (memberId) {
            const memberExists = await prisma.teamMember.findUnique({
                where: { id: memberId }
            });
            if (!memberExists) {
                memberId = null;
            }
        }

        // 3. Registrar o actualizar el token en la base de datos
        // Usamos upsert para garantizar que cada token sea único y no duplique registros
        const deviceToken = await prisma.deviceToken.upsert({
            where: { token: token },
            create: {
                token: token,
                platform: dbPlatform,
                appType: appType,
                userId: userId,
                memberId: memberId,
                isActive: true
            },
            update: {
                platform: dbPlatform,
                appType: appType,
                userId: userId,
                memberId: memberId,
                isActive: true,
                updatedAt: new Date()
            }
        });

        // 4. Retornar respuesta exitosa con los datos registrados (sin exponer ids internos sensibles de manera innecesaria)
        return NextResponse.json({
            success: true,
            registered: {
                token: deviceToken.token,
                platform: deviceToken.platform,
                appType: deviceToken.appType,
                updatedAt: deviceToken.updatedAt
            }
        });

    } catch (err: any) {
        console.error("Error en POST /api/v1/mobile/devices/register:", err);
        return NextResponse.json(
            { error: "Error interno del servidor al registrar el dispositivo" },
            { status: 500 }
        );
    }
}

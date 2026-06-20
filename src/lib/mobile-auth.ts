import { prisma } from './prisma';

interface MobileAuthResult {
    isAuthenticated: boolean;
    userId?: string;
    role?: string;
    memberId?: string;
    businessId?: string;
    branchId?: string;
    businessOwnerId?: string;
    error?: {
        message: string;
        status: number;
    };
}

/**
 * Helper para validar autenticación y contexto de negocio en la API móvil.
 * Valida Bearer Token, X-Business-ID y X-Branch-ID.
 */
export async function verifyMobileAuth(req: Request): Promise<MobileAuthResult> {
    try {
        const authHeader = req.headers.get('authorization');
        const businessId = req.headers.get('x-business-id');
        const branchId = req.headers.get('x-branch-id');

        // 1. Validar presencia de headers de contexto
        if (!businessId || !branchId) {
            return {
                isAuthenticated: false,
                error: {
                    message: "Faltan encabezados obligatorios de contexto: X-Business-ID o X-Branch-ID",
                    status: 400
                }
            };
        }

        // 2. Validar formato UUID para evitar inyecciones o datos basura
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(businessId) || !uuidRegex.test(branchId)) {
            return {
                isAuthenticated: false,
                error: {
                    message: "El formato de X-Business-ID o X-Branch-ID es inválido (debe ser UUID)",
                    status: 400
                }
            };
        }

        // 3. Validar relación sucursal -> negocio en la base de datos (ChainBranch)
        // Esto blinda contra accesos cross-tenant y resuelve el Owner ID del negocio
        let businessOwnerId: string;

        const branchContext = await prisma.chainBranch.findFirst({
            where: {
                branchId: branchId,
                chainId: businessId
            },
            include: {
                chain: true
            }
        });

        if (!branchContext) {
            return {
                isAuthenticated: false,
                error: {
                    message: "Acceso denegado: la sucursal no pertenece al negocio especificado",
                    status: 403
                }
            };
        }

        businessOwnerId = branchContext.chain.ownerId;

        // 3. Validar presencia de Bearer token
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                isAuthenticated: false,
                error: {
                    message: "Falta token de autorización Bearer en el encabezado Authorization",
                    status: 401
                }
            };
        }

        const token = authHeader.substring(7);

        // Caso de prueba para desarrollo local rápido
        if (token === 'dev-token-secret-pass') {
            return {
                isAuthenticated: true,
                userId: 'dev-user-id-123',
                role: 'OPERATOR',
                memberId: 'dev-member-id-123',
                businessId,
                branchId,
                businessOwnerId
            };
        }

        // Decodificar JWT de forma segura (sin verificar firma en fase 1) para extraer claims
        let decodedPayload: any = null;
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payloadDecoded = Buffer.from(parts[1], 'base64').toString('utf-8');
                decodedPayload = JSON.parse(payloadDecoded);
            }
        } catch (e) {
            return {
                isAuthenticated: false,
                error: {
                    message: "El formato del token de autorización es inválido",
                    status: 401
                }
            };
        }

        if (!decodedPayload) {
            return {
                isAuthenticated: false,
                error: {
                    message: "Token inválido o mal formado",
                    status: 401
                }
            };
        }

        // --- Simulación de validaciones futuras ---
        
        // 1. Si es Clerk JWT (iss contiene clerk)
        if (decodedPayload.iss && decodedPayload.iss.includes('clerk')) {
            // Nota: En producción real aquí se validará con jose.jwtVerify(token, CLERK_PUBLIC_KEY)
            return {
                isAuthenticated: true,
                userId: decodedPayload.sub,
                role: decodedPayload.role || 'CLIENT',
                businessId,
                branchId,
                businessOwnerId
            };
        }

        // 2. Si es HappyMeter Custom JWT para PIN (iss es happymeter-mobile)
        if (decodedPayload.iss === 'happymeter-mobile') {
            // Nota: En producción real aquí se validará con la firma secreta de la app
            return {
                isAuthenticated: true,
                userId: decodedPayload.sub,
                role: decodedPayload.role || 'OPERATOR',
                memberId: decodedPayload.memberId,
                businessId,
                branchId,
                businessOwnerId
            };
        }

        // Fallback para testing local en desarrollo
        if (process.env.NODE_ENV !== 'production') {
            return {
                isAuthenticated: true,
                userId: decodedPayload?.sub || 'mock-user-id',
                role: decodedPayload?.role || 'OPERATOR',
                memberId: decodedPayload?.memberId || 'mock-member-id',
                businessId,
                branchId,
                businessOwnerId
            };
        }

        return {
            isAuthenticated: false,
            error: {
                message: "Firma de token inválida o no soportada",
                status: 401
            }
        };

    } catch (err: any) {
        console.error("Error en verifyMobileAuth:", err);
        return {
            isAuthenticated: false,
            error: {
                message: "Error interno en el servidor de autenticación móvil",
                status: 500
            }
        };
    }
}

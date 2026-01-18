'use server'

import { prisma } from '@/lib/prisma'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// --- Types ---
export type ChainWithBranches = {
    id: string
    name: string
    ownerId: string
    branches: {
        id: string
        name: string | null
        branch: {
            userId: string
            businessName: string | null
            email: string | null
        }
    }[]
}

// --- Actions ---

export async function createChain(name: string) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const chain = await prisma.chain.create({
            data: {
                name,
                ownerId: user.id
            }
        })

        await prisma.chainBranch.create({
            data: {
                chainId: chain.id,
                branchId: user.id,
                name: name || 'Sede Principal',
                order: 0
            }
        })

        revalidatePath('/chains')
        return { success: true, chainId: chain.id }
    } catch (error) {
        console.error('Error creating chain:', error)
        return { success: false, error: String(error) }
    }
}

export async function addBranch(chainId: string, data: { name: string, email?: string }) {
    console.log('[Chain] Starting addBranch PAYLOAD FIX 2', { chainId, name: data.name });
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const chain = await prisma.chain.findUnique({
            where: { id: chainId },
            include: { branches: true }
        })

        if (!chain || chain.ownerId !== user.id) {
            throw new Error('Unauthorized to add branch to this chain')
        }

        const client = await clerkClient()
        let clerkUserId: string;

        // ESTRATEGIA DEFINITIVA: "System User" (Branches.happymeter.app)

        const isPlaceholder = !data.email || data.email.trim() === '';

        // Limpieza agresiva del nombre
        const safeName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
        const uniqueId = Math.random().toString(36).substring(2, 9);

        // Email de sistema interno
        const systemEmail = `branch-${safeName}-${uniqueId}@branches.happymeter.app`;
        const systemUsername = `branch_${safeName}_${uniqueId}`; // Username backup

        const emailToUse = isPlaceholder ? systemEmail : data.email!;

        // Password MUY FUERTE generado (Cumple requisitos: 12 chars, Upper, Lower, Number, Symbol)
        // Ejemplo: Br@nch-XyZ1...
        const safePassword = `B${Math.random().toString(36).slice(2, 6).toUpperCase()}r${Math.random().toString(36).slice(2, 6)}!${Math.floor(Math.random() * 100)}`;

        try {
            // Intentamos enviar TODOS los campos posibles para evitar "missing data"
            // Algunos Clerk instances requieren username, otras first/last name. Enviamos todo.
            const clerkPayload: any = {
                emailAddress: [emailToUse],
                username: isPlaceholder ? systemUsername : undefined, // Solo enviamos username si es sistema (evitar colisión si es email real)
                firstName: data.name.slice(0, 20), // Truncate por si acaso
                lastName: 'Sucursal', // Apellido dummy por si es requerido
                password: safePassword,
                skipPasswordRequirement: false, // Enviamos un pass válido
                publicMetadata: {
                    isBranch: true,
                    chainId: chain.id,
                    isPlaceholder: isPlaceholder,
                    managedBy: user.id
                }
            };

            // Remove username if undefined (aunque JSON stringify lo quita, Clerk lib puede quejarse)
            if (!clerkPayload.username) delete clerkPayload.username;

            console.log('[Chain] Creating User Payload:', { email: emailToUse, username: clerkPayload.username });

            const newUser = await client.users.createUser(clerkPayload);
            clerkUserId = newUser.id
            console.log('[Chain] OK Clerk ID:', clerkUserId);

        } catch (e: any) {
            console.error('[Chain] FAIL Clerk Create:', JSON.stringify(e, null, 2));

            // Análisis de error profundo
            const errorCode = e.errors?.[0]?.code;
            const errorParam = e.errors?.[0]?.meta?.paramName;
            const errorMsg = e.errors?.[0]?.message;

            if (errorCode === 'form_identifier_exists') {
                throw new Error(`El email ${emailToUse} ya existe.`)
            }

            // Si falta dato específico
            if (errorMsg && errorMsg.includes('missing')) {
                throw new Error(`Error Clerk (Faltan datos): ${errorParam || errorMsg}`)
            }

            throw new Error(`Error al crear usuario de sucursal: ${errorMsg || e.message}`)
        }

        // 2. Create UserSettings
        try {
            await prisma.userSettings.create({
                data: {
                    userId: clerkUserId,
                    businessName: data.name,
                    plan: 'ENTERPRISE', // Unrestricted as requested
                    isOnboarded: true,
                    // Set defaults to avoid null constraints
                    isPhoneVerified: false,
                    hasSeenTour: false,
                }
            })
        } catch (dbError: any) {
            // Si falla DB, intentamos rollback del usuario Clerk
            console.error('[Chain] FAIL DB Create:', dbError);
            try { await client.users.deleteUser(clerkUserId) } catch { }
            throw new Error(`Error guardando en base de datos: ${dbError.message}`)
        }

        // 3. Link to Chain
        await prisma.chainBranch.create({
            data: {
                chainId: chain.id,
                branchId: clerkUserId,
                name: data.name,
                slug: safeName, // Guarda el slug para usar en URLs
                order: chain.branches.length + 1
            }
        })

        revalidatePath('/chains')
        return { success: true }
    } catch (error: any) {
        console.error('[Chain] CRITICAL ERROR:', error)
        return { success: false, error: error.message || String(error) }
    }
}

export async function getChainDetails() {
    try {
        const user = await currentUser()
        if (!user) return null

        const chains = await prisma.chain.findMany({
            where: {
                OR: [
                    { ownerId: user.id },
                    { branches: { some: { branchId: user.id } } }
                ]
            },
            include: {
                branches: {
                    orderBy: { order: 'asc' },
                    include: {
                        branch: {
                            select: {
                                userId: true,
                                businessName: true
                            }
                        }
                    }
                }
            }
        })

        return chains
    } catch (error) {
        console.error('Error fetching chains:', error)
        return []
    }
}


export async function enterBranch(branchUserId: string) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const branchRelation = await prisma.chainBranch.findFirst({
            where: { branchId: branchUserId },
            include: { chain: true }
        })

        if (!branchRelation) throw new Error('Branch not found')

        if (branchRelation.chain.ownerId !== user.id) {
            throw new Error('Unauthorized: You do not own this branch')
        }

        const client = await clerkClient()
        const signInToken = await client.signInTokens.createSignInToken({
            userId: branchUserId,
            expiresInSeconds: 60,
        })

        // Force redirect to absolute dashboard URL to avoid "accounts.domain" 404s
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com';

        // Fix: Redirect to specific branch slug to ensure correct context
        const targetPath = branchRelation.slug ? `/dashboard/${branchRelation.slug}` : '/dashboard';
        const redirectUrl = `${baseUrl}${targetPath}`;

        const tokenUrl = new URL(signInToken.url)
        tokenUrl.searchParams.append('redirect_url', redirectUrl)

        return { success: true, url: tokenUrl.toString() }
    } catch (error) {
        console.error('Error entering branch:', error)
        return { success: false, error: String(error) }
    }
}

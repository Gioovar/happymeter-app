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
    console.log('[Chain] Starting addBranch SIMPLE', { chainId, name: data.name });
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

        // ESTRATEGIA DEFINITIVA: "System User"
        // No usamos alias. Usamos un email de sistema que JAMAS fallará.
        // El usuario ni se entera.

        const isPlaceholder = !data.email || data.email.trim() === '';

        // Limpieza agresiva del nombre para evitar caracteres raros en email
        const safeName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
        const uniqueId = Math.random().toString(36).substring(2, 9);

        // Email: branch-nombre-id@branches.happymeter.app (Dominio dummy seguro)
        const systemEmail = `branch-${safeName}-${uniqueId}@branches.happymeter.app`;

        const emailToUse = isPlaceholder ? systemEmail : data.email!;

        // Password que cumple CUALQUIER política (Upper+Lower+Number+Symbol, 12 chars)
        const safePassword = `B${Math.random().toString(36).slice(2, 8).toUpperCase()}!${Math.random().toString(36).slice(2, 8)}7`;

        try {
            const clerkPayload: any = {
                emailAddress: [emailToUse],
                firstName: data.name,
                // Siempre enviamos password para evitar "missing data" o "password required" errors
                password: safePassword,
                skipPasswordRequirement: false,
                publicMetadata: {
                    isBranch: true,
                    chainId: chain.id,
                    isPlaceholder: isPlaceholder,
                    managedBy: user.id
                }
            };

            console.log('[Chain] Creating Clerk User with payload', { email: emailToUse });
            const newUser = await client.users.createUser(clerkPayload);
            clerkUserId = newUser.id
            console.log('[Chain] OK Clerk ID:', clerkUserId);

        } catch (e: any) {
            console.error('[Chain] FAIL Clerk Create:', JSON.stringify(e, null, 2));

            // Si falla Clerk, devolvemos error amigable
            // Si es "form_identifier_exists", pedimos otro email
            if (e.errors?.[0]?.code === 'form_identifier_exists') {
                throw new Error(`El email ${emailToUse} ya existe.`)
            }

            // Si es "password_pwned", reintentamos (muy raro con random)
            if (e.errors?.[0]?.code === 'form_password_pwned') {
                throw new Error('Error interno de seguridad (Pass). Intenta de nuevo.')
            }

            throw new Error(`Error al crear usuario de sucursal: ${e.errors?.[0]?.message || e.message}`)
        }

        // 2. Create UserSettings
        console.log('[Chain] Creating UserSettings');
        try {
            await prisma.userSettings.create({
                data: {
                    userId: clerkUserId,
                    businessName: data.name,
                    plan: 'FREE',
                    isOnboarded: true,
                    // Defaults seguros
                }
            })
        } catch (dbError: any) {
            console.error('[Chain] FAIL DB Create UserSettings:', dbError);
            // Intentar borrar el usuario de Clerk para no dejar basura?
            // await client.users.deleteUser(clerkUserId).catch(() => {});
            throw new Error(`Error base de datos: ${dbError.message}`)
        }

        // 3. Link to Chain
        console.log('[Chain] Linking');
        await prisma.chainBranch.create({
            data: {
                chainId: chain.id,
                branchId: clerkUserId,
                name: data.name,
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
            where: { ownerId: user.id },
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

        const tokenUrl = new URL(signInToken.url)
        return { success: true, url: tokenUrl.toString() }

    } catch (error) {
        console.error('Error entering branch:', error)
        return { success: false, error: String(error) }
    }
}

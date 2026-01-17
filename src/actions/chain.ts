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

        // Create the chain
        const chain = await prisma.chain.create({
            data: {
                name,
                ownerId: user.id
            }
        })

        // Add current user as the first branch (Headquarters)
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

export async function addBranch(chainId: string, data: { name: string, email?: string, password?: string }) {
    console.log('[Chain] Starting addBranch', { chainId, name: data.name });
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const chain = await prisma.chain.findUnique({
            where: { id: chainId },
            include: { branches: true }
        })

        if (!chain || chain.ownerId !== user.id) {
            throw new Error('Unauthorized to add branch to this chain')
        }

        // 1. Create Clerk User
        const client = await clerkClient()
        let clerkUserId: string;

        // ESTRATEGIA: Owner Email Aliasing (user+branch@...)
        // Esto garantiza que el dominio es válido y que el usuario recibe notificaciones.
        let baseEmail = 'noreply@happymeters.com'; // Fallback

        // Intentar obtener el email principal del usuario
        const primaryEmailObj = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId) || user.emailAddresses[0];
        if (primaryEmailObj) {
            baseEmail = primaryEmailObj.emailAddress;
        }

        const isPlaceholder = !data.email || data.email.trim() === '';
        let emailToUse = data.email;

        if (isPlaceholder) {
            // Generar alias: usuario+sucursalX@gmail.com
            const [localPart, domainPart] = baseEmail.split('@');
            // Limpiar nombre de sucursal
            const cleanBranchName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
            const uniqueId = Math.random().toString(36).substring(2, 6);

            // Si el email original ya tenía un '+', lo respetamos o lo cortamos? 
            // Mejor cortarlo para evitar `user+tag+tag@`
            const cleanLocalPart = localPart.split('+')[0];

            emailToUse = `${cleanLocalPart}+${cleanBranchName}${uniqueId}@${domainPart}`;
        }

        // Password FUERTE generado
        // Mix de mayusculas, minusculas, numeros y simbolos
        const pswd = `Br@nch-${Math.random().toString(36).slice(2).toUpperCase()}!${Math.random().toString(36).slice(2)}`;

        console.log('[Chain] Creating Clerk user', { emailToUse });

        try {
            // Configuración explícita para evitar errores de validación
            // NO usamos skipPasswordRequirement: true porque a veces falla si el password es débil
            // Mejor enviamos un password fuerte
            const newUser = await client.users.createUser({
                emailAddress: [emailToUse!],
                password: data.password || pswd,
                firstName: data.name,
                skipPasswordRequirement: false,
                publicMetadata: {
                    isBranch: true,
                    chainId: chain.id,
                    managedBy: user.id
                }
            });
            clerkUserId = newUser.id
            console.log('[Chain] Clerk user created', { clerkUserId });

        } catch (e: any) {
            console.error('[Chain] Clerk Create Error:', JSON.stringify(e, null, 2));

            // Manejo de errores específicos
            if (e.errors?.[0]?.code === 'form_identifier_exists') {
                throw new Error(`El email ${emailToUse} ya está registrado.`)
            }
            if (e.errors?.[0]?.code === 'form_password_pwned') {
                throw new Error(`Password inseguro. Intenta de nuevo.`)
            }

            const msg = e.errors?.[0]?.message || e.message || 'Error desconocido al crear usuario';
            throw new Error(`Error Clerk: ${msg}`)
        }

        // 2. Create UserSettings in DB for the new branch
        // Aseguramos que los campos coincidan con el schema
        console.log('[Chain] Creating UserSettings');
        await prisma.userSettings.create({
            data: {
                userId: clerkUserId,
                businessName: data.name,
                plan: 'FREE',
                isOnboarded: true,
                // Opcional: Copiar settings del padre? Por ahora default.
            }
        })

        // 3. Link to Chain
        console.log('[Chain] Linking to Chain');
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
        console.error('[Chain] Error adding branch:', error)
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

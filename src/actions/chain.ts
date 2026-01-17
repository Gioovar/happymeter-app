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

        // ESTRATEGIA ROBUSTA: Email de sistema
        // Usamos un dominio "ficticio" pero válido sintácticamente para uso interno
        // Esto evita errores con emails reales, alias, o validaciones de dominio
        const cleanName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
        const uniqueId = Math.random().toString(36).substring(2, 8);

        // Si el usuario proporcionó email, úsalo. Si no, genera uno de sistema.
        const isPlaceholder = !data.email || data.email.trim() === '';

        // Formato: branch-empresa-x8d9@branches.happymeter.app
        const systemEmail = `branch-${cleanName}-${uniqueId}@branches.happymeter.app`;
        const emailToUse = isPlaceholder ? systemEmail : data.email!;

        // Password seguro generado para cumplir cualquier política
        const pswd = `Branch${Math.random().toString(36).slice(2)}!A1`;

        try {
            // Prepare payload standard
            const clerkPayload: any = {
                emailAddress: [emailToUse],
                firstName: data.name,
                password: data.password || pswd, // Enviamos password siempre
                skipPasswordRequirement: false, // No saltamos validación, cumplimos con ella
                publicMetadata: {
                    isBranch: true,
                    chainId: chain.id,
                    isPlaceholder: isPlaceholder,
                    managedBy: user.id
                }
            };

            // Try creating new user
            const newUser = await client.users.createUser(clerkPayload);
            clerkUserId = newUser.id

        } catch (e: any) {
            console.error('Clerk Create Error FULL:', JSON.stringify(e, null, 2));
            const msg = e.errors?.[0]?.message || e.message || 'Error creating branch user';

            if (e.errors?.[0]?.code === 'form_identifier_exists') {
                throw new Error(`El email ${emailToUse} ya está registrado.`)
            }

            throw new Error(`Error de Clerk: ${msg}`)
        }

        // 2. Create UserSettings in DB for the new branch
        await prisma.userSettings.create({
            data: {
                userId: clerkUserId,
                businessName: data.name,
                plan: 'FREE',
                isOnboarded: true,
            }
        })

        // 3. Link to Chain
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
        console.error('Error adding branch:', error)
        // Ensure serialization of error
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

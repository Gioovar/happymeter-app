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

        // If email is provided, use it. If not, generate a placeholder.
        const isPlaceholder = !data.email || data.email.trim() === '';
        // Use a clean slug for the email alias
        const safeName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const emailToUse = isPlaceholder
            ? `branch-${safeName}-${randomSuffix}@full-access-placeholder.com` // Dummy domain, ensures uniqueness
            : data.email!;

        try {
            // Try creating new user
            const newUser = await client.users.createUser({
                emailAddress: [emailToUse],
                password: data.password || (isPlaceholder ? `P-${Math.random().toString(36)}!` : undefined),
                firstName: data.name,
                skipPasswordRequirement: !data.password && !isPlaceholder,
                publicMetadata: {
                    isBranch: true,
                    chainId: chain.id,
                    isPlaceholder: isPlaceholder
                }
            })
            clerkUserId = newUser.id
        } catch (e: any) {
            // Logic for existing users
            if (e.errors?.[0]?.code === 'form_identifier_exists') {
                // Improve error message for the user
                throw new Error(`El email ${emailToUse} ya está registrado. Por favor usa un email diferente para el encargado de esta sucursal, o déjalo vacío para asignarlo después.`)
            }
            throw e
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
        return { success: false, error: String(error.message || error) }
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
                                // We can't select email here reliably as it's not in UserSettings by default in this schema version
                                // But let's assume we use display name
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

        // Verify that the current user owns the chain that this branch belongs to
        // OR that the current user IS the branch (re-authing?) - no, this is for owner impersonation

        const branchRelation = await prisma.chainBranch.findFirst({
            where: { branchId: branchUserId },
            include: { chain: true }
        })

        if (!branchRelation) throw new Error('Branch not found')

        if (branchRelation.chain.ownerId !== user.id) {
            throw new Error('Unauthorized: You do not own this branch')
        }

        // Generate Token
        // Using the same logic as admin impersonation
        const client = await clerkClient()
        const signInToken = await client.signInTokens.createSignInToken({
            userId: branchUserId,
            expiresInSeconds: 60,
        })

        // Construct URL
        // We can't easily get the base URL here in server action without headers hack or hardcoding
        // But for redirect, we can return the token URL and let client handle, or cleaner:
        // Use relative path for redirect_url parameter inside the token

        // Note: signInToken.url is a full URL to Clerk.
        // We can append redirect_url to it.
        const tokenUrl = new URL(signInToken.url)
        // Redirect to dashboard after login
        // We need the APP_URL env var or similar. 
        // For now, let's assume we return the direct clerk URL, and let Clerk handle default redirect or we append it if we know the domain.

        // Better: let's verify if we need to pass redirect_url. 
        // Usually Clerk redirects to after-sign-in path.

        return { success: true, url: tokenUrl.toString() }

    } catch (error) {
        console.error('Error entering branch:', error)
        return { success: false, error: String(error) }
    }
}

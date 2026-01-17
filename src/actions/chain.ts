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

        // Get owner email to use as base if needed
        let baseEmail = 'noreply@happymeters.com';
        if (user.emailAddresses && user.emailAddresses.length > 0) {
            baseEmail = user.emailAddresses[0].emailAddress;
        }

        // If email is provided, use it. If not, generate a sub-address of the owner.
        const isPlaceholder = !data.email || data.email.trim() === '';

        let emailToUse = data.email;

        if (isPlaceholder) {
            // sub-addressing: user+branchX@domain.com
            const [local, domain] = baseEmail.split('@');
            const safeBranchName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
            const uniqueSuffix = Math.random().toString(36).substring(2, 6);

            // Handle existing +
            const cleanLocal = local.includes('+') ? local.split('+')[0] : local;
            emailToUse = `${cleanLocal}+${safeBranchName}-${uniqueSuffix}@${domain}`;
        }

        try {
            // Prepare payload - SIMPLIFIED to avoid "missing data" errors
            const clerkPayload: any = {
                emailAddress: [emailToUse],
                firstName: data.name,
                skipPasswordRequirement: true, // CRITICAL: Tell Clerk we intentionally don't want a password
                publicMetadata: {
                    isBranch: true,
                    chainId: chain.id,
                    isPlaceholder: isPlaceholder,
                    managedBy: user.id
                }
            };

            // Only include password if explicitly provided by user (future proofing)
            if (data.password && data.password.length >= 8) {
                clerkPayload.password = data.password;
                clerkPayload.skipPasswordRequirement = false;
            }

            // Try creating new user
            const newUser = await client.users.createUser(clerkPayload);
            clerkUserId = newUser.id

        } catch (e: any) {
            console.error('Clerk Create Error:', JSON.stringify(e, null, 2));
            // Parse Clerk error details
            const paramName = e.errors?.[0]?.meta?.paramName || '';
            const msg = e.errors?.[0]?.message || e.message || 'Error creating branch user';

            if (e.errors?.[0]?.code === 'form_identifier_exists') {
                throw new Error(`El email ${emailToUse} ya está registrado.`)
            }

            throw new Error(`Error de Clerk: ${msg} ${paramName ? `(${paramName})` : ''}`)
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
        const tokenUrl = new URL(signInToken.url)

        return { success: true, url: tokenUrl.toString() }

    } catch (error) {
        console.error('Error entering branch:', error)
        return { success: false, error: String(error) }
    }
}

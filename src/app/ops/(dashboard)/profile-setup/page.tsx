
import { getOpsSession } from '@/lib/ops-auth'
import { currentUser as getClerkUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileSetupForm from '@/components/ops/ProfileSetupForm'

export default async function ProfileSetupPage() {
    const session = await getOpsSession()

    if (!session.isAuthenticated || !session.member) {
        redirect('/ops/login')
    }

    // Determine initial data based on session type
    let initialData = undefined
    let email = undefined

    if (session.isOffline) {
        // For Offline users, we use TeamMember data
        initialData = {
            name: session.member.name,
            jobTitle: session.member.jobTitle,
            phone: session.member.phone,
            photoUrl: session.member.photoUrl
        }
    } else if (session.userId) {
        // For Clerk users, try to get UserSettings first (legacy) or fallback to TeamMember
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: session.userId },
            select: {
                fullName: true,
                jobTitle: true,
                phone: true,
                photoUrl: true
            }
        })

        initialData = userSettings ? {
            name: userSettings.fullName,
            jobTitle: userSettings.jobTitle,
            phone: userSettings.phone,
            photoUrl: userSettings.photoUrl
        } : {
            name: session.member.name,
            jobTitle: session.member.jobTitle,
            phone: session.member.phone,
            photoUrl: session.member.photoUrl
        }

        const clerkUser = await getClerkUser()
        email = clerkUser?.emailAddresses[0]?.emailAddress
    }

    return (
        <div className="max-w-md mx-auto mt-8 px-4 pb-20">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Configura tu Perfil</h1>
                <p className="text-slate-400 text-sm">Actualiza tus datos para identificarte mejor con el equipo.</p>
            </div>

            <ProfileSetupForm initialData={initialData} email={email} />
        </div>
    )
}


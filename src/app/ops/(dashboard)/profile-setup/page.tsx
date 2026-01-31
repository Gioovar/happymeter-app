
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileSetupForm from '@/components/ops/ProfileSetupForm'

export default async function ProfileSetupPage() {
    const { userId } = await auth()

    if (!userId) {
        redirect('/')
    }

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: {
            fullName: true,
            jobTitle: true,
            phone: true,
            photoUrl: true
        }
    })

    const initialData = userSettings ? {
        name: userSettings.fullName,
        jobTitle: userSettings.jobTitle,
        phone: userSettings.phone,
        photoUrl: userSettings.photoUrl
    } : undefined

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Configura tu Perfil</h1>
                <p className="text-slate-400 text-sm">Necesitamos tus datos para identificarte en el equipo.</p>
            </div>

            <ProfileSetupForm initialData={initialData} />
        </div>
    )
}

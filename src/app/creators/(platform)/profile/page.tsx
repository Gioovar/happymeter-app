
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/creators/ProfileForm'
import { User, CreditCard } from 'lucide-react'

export default async function CreatorProfilePage() {
    const user = await currentUser()
    if (!user) redirect('/')

    const profile = await prisma.affiliateProfile.findUnique({
        where: { userId: user.id },
        include: { user: true }
    })

    if (!profile) redirect('/creators/onboarding')

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
                <p className="text-gray-400">Gestiona tu información personal y de pagos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-violet-500" />
                        Información Personal
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Nombre</label>
                            <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Email</label>
                            <p className="text-white font-medium">{user.emailAddresses[0].emailAddress}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Código de Afiliado</label>
                            <div className="flex items-center gap-2">
                                <code className="bg-white/5 px-2 py-1 rounded text-violet-300 font-mono">
                                    {profile.code}
                                </code>
                                <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full capitalize">
                                    {profile.status.toLowerCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <CreditCard className="w-5 h-5 text-green-500" />
                        Datos de Pago y Redes
                    </h2>
                    <ProfileForm profile={profile} />
                </div>
            </div>
        </div>
    )
}

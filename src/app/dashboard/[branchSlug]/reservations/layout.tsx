
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { checkReservationAccess } from '@/lib/limits'
import { Lock, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ReservationsLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: { branchSlug: string }
}) {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
    })

    if (userSettings) {
        const hasAccess = checkReservationAccess(userSettings.createdAt, userSettings.plan)

        if (!hasAccess) {
            return (
                <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center space-y-8 max-w-xl mx-auto p-6 animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-violet-500/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative p-6 bg-[#111] rounded-full border border-violet-500/30 shadow-2xl">
                            <Lock className="w-12 h-12 text-violet-400" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-white tracking-tight">Periodo de Prueba Finalizado</h1>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            El acceso gratuito a Reservaciones es de <span className="text-violet-400 font-bold">7 días</span>.
                            Para continuar gestionando tus mesas y reservas, necesitas un plan activo.
                        </p>
                    </div>

                    <div className="w-full bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider text-left pl-2 mb-4">Lo que obtienes al actualizar:</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-300">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Reservas Ilimitadas</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Gestión de Mesas y Capacidad</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Recordatorios Automáticos por WhatsApp</span>
                            </li>
                        </ul>
                    </div>

                    <Link href="/dashboard/settings/billing" className="w-full">
                        <button className="w-full py-4 rounded-xl bg-violet-600 text-white font-bold text-lg hover:bg-violet-500 transition shadow-lg shadow-violet-600/20 hover:scale-[1.02] active:scale-[0.98]">
                            Ver Paquetes y Actualizar
                        </button>
                    </Link>

                    <p className="text-xs text-gray-500">
                        ¿Tienes dudas? <a href="mailto:soporte@happymeter.com" className="text-gray-400 underline">Contáctanos</a>
                    </p>
                </div>
            )
        }
    }

    return (
        <>
            {children}
        </>
    )
}

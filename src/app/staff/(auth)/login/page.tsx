'use client'

import { useAuth, useUser, SignInButton, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { checkUserRole } from '@/actions/auth-check'

export default function StaffLoginPage() {
    const { isLoaded, userId, isSignedIn } = useAuth()
    const { user } = useUser()
    const router = useRouter()
    const [checkingRole, setCheckingRole] = useState(false)

    // Redirect if already logged in and confirmed as admin
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            setCheckingRole(true)
            const verifyRole = async () => {
                const { authorized, role } = await checkUserRole()

                if (authorized) {
                    if (role === 'STAFF') {
                        router.push('/staff')
                    } else {
                        router.push('/admin')
                    }
                } else {
                    setCheckingRole(false)
                }
            }
            verifyRole()
        }
    }, [isLoaded, isSignedIn, user, router])

    if (!isLoaded || checkingRole) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-900/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 blur-[120px] rounded-full" />

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                            <ShieldCheck className="w-10 h-10 text-violet-400" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
                    <p className="text-gray-400 mb-8">Acceso administrativo y operativo.</p>

                    {isSignedIn ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                                <p className="text-sm text-gray-400 mb-1">Sesión activa como</p>
                                <p className="text-white font-medium">{user?.primaryEmailAddress?.emailAddress || 'Usuario'}</p>
                            </div>

                            <SignOutButton redirectUrl="/staff/login">
                                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all transform hover:scale-[1.02]">
                                    Cerrar sesión para cambiar cuenta
                                </button>
                            </SignOutButton>

                            <p className="text-xs text-center text-gray-500 max-w-[250px] mx-auto">
                                Si continúas, cambiaremos a tu cuenta administrativa.
                            </p>
                        </div>
                    ) : (
                        <SignInButton mode="modal" forceRedirectUrl="/staff/login">
                            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all transform hover:scale-[1.02]">
                                Iniciar Sesión de Staff
                            </button>
                        </SignInButton>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/5">
                        <p className="text-xs text-gray-500">
                            Acceso restringido. Todas las actividades son monitoreadas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

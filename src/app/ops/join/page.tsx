'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, UploadCloud, User, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Image from 'next/image'
import { acceptInvitation, checkOfflineInvitation, acceptOfflineInvitation } from '@/actions/team'
import { useAuth, useClerk } from '@clerk/nextjs'

function OpsJoinContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { isLoaded, isSignedIn, userId } = useAuth()
    const { signOut } = useClerk()

    // URL State
    const urlToken = searchParams.get('token')

    // Form State
    const [step, setStep] = useState<'VERIFY' | 'PROFILE_SETUP' | 'AUTH' | 'SUCCESS'>('VERIFY')
    const [accessCode, setAccessCode] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState('')

    // Profile Setup State (for Offline Operators)
    const [profileData, setProfileData] = useState({ name: '', jobTitle: '', phone: '' })
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [photoBase64, setPhotoBase64] = useState<string | null>(null)
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)

    // Auto-fill from URL
    useEffect(() => {
        if (urlToken) {
            setAccessCode(urlToken)
        }
    }, [urlToken])

    // If already signed in, we might want to just process the code directly if they clicked a link
    // But for safety, let's make them confirm the code first.
    // Actually, if they are signed in, they are likely the wrong user if they are clicking an invite link?
    // Or maybe they just created the account.

    const handleVerifyCode = async () => {
        if (!accessCode) {
            setError('Por favor ingresa el código de acceso.')
            return
        }
        setIsVerifying(true)
        setError('')

        try {
            // Check if it looks like a 6-digit offline operator code (only digits)
            if (accessCode.length === 6 && /^\d+$/.test(accessCode)) {
                if (!isSignedIn) {
                    const checkRes = await checkOfflineInvitation(accessCode)
                    if (checkRes.success) {
                        setProfileData(prev => ({ ...prev, name: checkRes.businessName || '' }))
                        setStep('PROFILE_SETUP')
                    } else {
                        setError(checkRes.error || 'Código de operación inválido.')
                    }
                    return
                } else {
                    // Try to log out first or warn them? Offline operator flow doesn't need Clerk auth.
                    // We'll proceed with checking it anyway.
                    const checkRes = await checkOfflineInvitation(accessCode)
                    if (checkRes.success) {
                        setProfileData(prev => ({ ...prev, name: checkRes.businessName || '' }))
                        setStep('PROFILE_SETUP')
                        return
                    }
                }
            }

            // Standard Flow for non-operator invitations (requires Clerk auth)
            if (!isSignedIn) {
                setStep('AUTH')
            } else {
                // If signed in, try to accept directly
                await processAcceptance()
            }
        } catch (err) {
            console.error("Error in handleVerifyCode:", err)
            setError('Error verificando código.')
        } finally {
            setIsVerifying(false)
        }
    }

    const processAcceptance = async () => {
        setIsVerifying(true)
        try {
            const res = await acceptInvitation(accessCode)
            if (res.success) {
                setStep('SUCCESS')
                setTimeout(() => {
                    router.push('/ops/profile-setup')
                }, 2000)
            } else {
                if (res.errorCode === 'EMAIL_MISMATCH') {
                    // Show specific error and offer to sign out
                    toast.error(
                        <div className="flex flex-col gap-2">
                            <p className="font-bold">Cuenta Incorrecta</p>
                            <p className="text-xs">Estás conectado como <span className="text-yellow-400">{res.currentEmail}</span></p>
                            <p className="text-xs">La invitación es para <span className="text-cyan-400">{res.expectedEmail}</span></p>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => signOut({ redirectUrl: '/ops/login' })}
                            >
                                Cerrar Sesión e Intentar de Nuevo
                            </Button>
                        </div>,
                        { duration: 8000 }
                    )
                    setError('La cuenta actual no coincide con la invitación.')
                } else {
                    setError(res.error || 'Código inválido o expirado.')
                    if (res.error === 'Unauthorized') {
                        setStep('AUTH')
                    }
                }
            }
        } catch (err: any) {
            console.error("Error in processAcceptance:", err)
            setError('Ocurrió un error inesperado.')
        } finally {
            setIsVerifying(false)
        }
    }

    // Redirect to Clerk Auth then back here
    const handleAuthRedirect = (mode: 'signin' | 'signup') => {
        // We want to come back to this page with the token in URL so we don't lose context
        const returnUrl = `/ops/join?token=${accessCode}`
        const nextUrl = `/ops/login?mode=${mode}&redirect_url=${encodeURIComponent(returnUrl)}`

        router.push(nextUrl)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no debe pesar más de 5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            setPhotoPreview(result)
            setPhotoBase64(result)
        }
        reader.readAsDataURL(file)
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profileData.name || !profileData.jobTitle || !profileData.phone) {
            toast.error("Por favor completa los campos obligatorios.")
            return
        }

        setIsSubmittingProfile(true)
        try {
            const res = await acceptOfflineInvitation(accessCode, {
                ...profileData,
                photoUrl: photoBase64
            })

            if (res.success) {
                setStep('SUCCESS')
                setTimeout(() => {
                    router.push('/ops/tasks')
                }, 2000)
            } else {
                toast.error(res.error || "Ocurrió un error al configurar el perfil.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error de conexión.")
        } finally {
            setIsSubmittingProfile(false)
        }
    }

    if (!isLoaded) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-black to-black" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                        <ShieldCheck className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Portal Operativo
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">
                        HappyMeter Operations
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'VERIFY' && (
                        <motion.div
                            key="verify"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
                        >
                            <div className="space-y-4">
                                <Label className="text-gray-300">Código de Acceso</Label>
                                <Input
                                    className="bg-black/50 border-white/10 text-center font-mono text-xl tracking-widest uppercase h-14 focus:border-cyan-500/50 focus:ring-cyan-500/20 placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-600"
                                    placeholder="Ingresa tu código"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                />
                                {error && (
                                    <div className="text-red-400 text-xs flex items-center gap-2 bg-red-950/20 p-3 rounded-lg border border-red-500/10">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12"
                                onClick={handleVerifyCode}
                                disabled={isVerifying || !accessCode}
                            >
                                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar Código'}
                            </Button>

                            {/* UX Improvement: If signed in and error, offer to go to dashboard */}
                            {isSignedIn && error && (
                                <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="text-center mb-3">
                                        <p className="text-gray-400 text-xs">
                                            ¿Ya eres parte del equipo?
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 h-11"
                                        onClick={() => router.push('/ops')}
                                    >
                                        Ir al Portal Operativo
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}

                            {isSignedIn && (
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-2">Sesión iniciada como</p>
                                    <div className="flex items-center justify-center gap-2 bg-white/5 p-2 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-sm font-medium text-gray-300 truncate max-w-[200px]">{userId}</span>
                                    </div>
                                    <button
                                        onClick={() => signOut({ redirectUrl: '/ops/login' })}
                                        className="text-xs text-red-400 hover:text-red-300 mt-2 underline"
                                    >
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 'PROFILE_SETUP' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-white">Configura tu Perfil</h3>
                                <p className="text-gray-400 text-sm mt-1">Completa tus datos para formar parte del equipo operativo de este restaurante.</p>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-5">
                                {/* Photo Upload */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden bg-white/5 border border-dashed border-white/20 hover:border-cyan-500 transition-colors">
                                        {photoPreview ? (
                                            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                                <UploadCloud className="w-6 h-6 mb-1" />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Subir Foto (Opcional)</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Name Input */}
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase font-bold text-gray-400 flex items-center gap-2 ml-1">
                                            <User className="w-3.5 h-3.5" /> Nombre Completo <span className="text-red-400">*</span>
                                        </label>
                                        <Input
                                            className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50"
                                            placeholder="Ej. Juan Pérez"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    {/* Job Title Input */}
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase font-bold text-gray-400 flex items-center gap-2 ml-1">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Puesto / Cargo <span className="text-red-400">*</span>
                                        </label>
                                        <Input
                                            className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50"
                                            placeholder="Ej. Mesero, Hostess"
                                            value={profileData.jobTitle}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, jobTitle: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    {/* Phone Input */}
                                    <div className="space-y-1">
                                        <label className="text-xs uppercase font-bold text-gray-400 flex items-center gap-2 ml-1">
                                            <Phone className="w-3.5 h-3.5" /> Teléfono Celular <span className="text-red-400">*</span>
                                        </label>
                                        <Input
                                            type="tel"
                                            className="bg-black/50 border-white/10 text-white focus:border-cyan-500/50"
                                            placeholder="10 dígitos"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 mt-2"
                                    disabled={isSubmittingProfile || !profileData.name || !profileData.jobTitle || !profileData.phone}
                                >
                                    {isSubmittingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar al Sistema'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setStep('VERIFY')}
                                    className="w-full text-xs text-gray-500 hover:text-gray-300 mt-2"
                                >
                                    Cancelar y volver atrás
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'AUTH' && (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 text-center"
                        >
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Identifícate</h3>
                                <p className="text-gray-400 text-sm">
                                    Para vincular este código a tu perfil, necesitas iniciar sesión o crear una cuenta.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    className="w-full bg-white text-black hover:bg-gray-200 font-bold h-11"
                                    onClick={() => handleAuthRedirect('signup')}
                                >
                                    Soy Nuevo (Crear Cuenta)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-white/10 text-gray-300 hover:bg-white/5 hover:text-white h-11"
                                    onClick={() => handleAuthRedirect('signin')}
                                >
                                    Ya tengo cuenta
                                </Button>
                            </div>

                            <button
                                onClick={() => setStep('VERIFY')}
                                className="text-xs text-gray-500 hover:text-gray-300 mt-4"
                            >
                                ← Volver a verificar código
                            </button>
                        </motion.div>
                    )}

                    {step === 'SUCCESS' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#111] border border-green-500/20 rounded-2xl p-8 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">¡Acceso Concedido!</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Te hemos unido al equipo correctamente. Redirigiendo...
                            </p>
                            <Loader2 className="w-6 h-6 animate-spin text-gray-600 mx-auto" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute bottom-6 text-center w-full">
                <p className="text-[10px] text-gray-600 tracking-widest uppercase">
                    Secure Operations Portal
                </p>
            </div>
        </div>
    )
}

export default function OpsJoinPage() {
    return (
        <Suspense>
            <OpsJoinContent />
        </Suspense>
    )
}

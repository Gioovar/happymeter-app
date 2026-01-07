'use client'

import { useState } from 'react'
import { SignIn, SignUp } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";

export default function OpsLoginPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 pb-20 relative overflow-hidden">

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col gap-8">

                {/* Header for Staff */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <BrandLogo size="lg" />
                    </div>
                    {/* <h1 className="text-2xl font-bold text-white tracking-tight">Portal Operativo</h1> */}
                    <p className="text-slate-400 text-sm">Portal de Operaciones</p>
                </div>

                {/* Custom Clerk Auth Forms */}
                <div className="w-full">
                    {mode === 'signin' ? (
                        <SignIn
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full p-8",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    socialButtonsBlockButton: "bg-slate-800 border-white/5 hover:bg-slate-700 text-white",
                                    dividerLine: "bg-slate-700",
                                    dividerText: "text-slate-500",
                                    formFieldLabel: "text-slate-300",
                                    formFieldInput: "bg-slate-950 border-slate-800 text-white focus:border-indigo-500 transition-colors",
                                    footerAction: "hidden",
                                    formButtonPrimary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl",
                                    identityPreviewText: "text-slate-300",
                                    formFieldInputShowPasswordButton: "text-slate-400"
                                },
                                layout: {
                                    socialButtonsPlacement: 'bottom',
                                    showOptionalFields: false
                                }
                            }}
                            redirectUrl="/ops/tasks"
                        />
                    ) : (
                        <SignUp
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full p-8",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    socialButtonsBlockButton: "bg-slate-800 border-white/5 hover:bg-slate-700 text-white",
                                    dividerLine: "bg-slate-700",
                                    dividerText: "text-slate-500",
                                    formFieldLabel: "text-slate-300",
                                    formFieldInput: "bg-slate-950 border-slate-800 text-white focus:border-indigo-500 transition-colors",
                                    footerAction: "hidden",
                                    formButtonPrimary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl",
                                    identityPreviewText: "text-slate-300",
                                    formFieldInputShowPasswordButton: "text-slate-400"
                                },
                                layout: {
                                    socialButtonsPlacement: 'bottom',
                                    showOptionalFields: false
                                }
                            }}
                            forceRedirectUrl="/ops/profile-setup"
                        />
                    )}
                </div>

                <div className="text-center space-y-2">
                    <p className="text-xs text-slate-600">
                        {mode === 'signin' ? "Solo personal autorizado." : "Registro de nuevo personal."}
                    </p>
                    <button
                        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        className="text-indigo-400 text-xs hover:text-indigo-300 font-medium transition-colors"
                    >
                        {mode === 'signin' ? "¿Eres nuevo? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
                    </button>
                </div>
            </div>
        </div>
    )
}

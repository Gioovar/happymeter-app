'use client'

import React from 'react'
import { UserButton } from '@clerk/nextjs'
import { MessageCircle, ShieldAlert } from 'lucide-react'

export default function SuspendedOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 animate-in fade-in duration-500">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-md w-full bg-[#111] border border-red-500/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">

                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/30">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Cuenta Bloqueada</h1>

                <p className="text-gray-400 mb-8 leading-relaxed">
                    Tu cuenta se encuentra temporalmente bloqueada por seguridad o políticas de la plataforma. <br />
                    <span className="text-gray-500 text-sm mt-2 block">Tus datos permanecen seguros.</span>
                </p>

                <div className="w-full space-y-4">
                    <a
                        href="https://wa.me/521234567890" // Replace with actual support number if known, or generic
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Contactar Soporte
                    </a>

                    <div className="pt-4 flex justify-center">
                        <UserButton afterSignOutUrl="/sign-in" />
                    </div>
                </div>

                <div className="mt-8 text-xs text-gray-600 font-mono">
                    Reference ID: {new Date().getTime().toString().slice(-6)}
                </div>
            </div>
        </div>
    )
}

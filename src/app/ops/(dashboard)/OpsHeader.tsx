'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, Menu, X, CheckSquare, ScanLine, LogOut } from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'

export default function OpsHeader() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    return (
        <>
            {/* Header Bar */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm text-white leading-none">Ops</h1>
                        <p className="text-[10px] text-slate-400 font-medium">Panel Operativo</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-200 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu Content */}
                    <div className="relative w-3/4 max-w-xs bg-slate-900 h-full border-l border-white/10 p-6 flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-white font-bold text-lg">Menu</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <nav className="space-y-2 flex-1">
                            <Link
                                href="/ops/tasks"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname.startsWith('/ops/tasks')
                                        ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                        : 'text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <CheckSquare className="w-5 h-5" />
                                Mis Tareas
                            </Link>

                            {/* Assuming scanner page exists based on folder structure */}
                            <Link
                                href="/ops/scanner"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname?.includes('/scanner')
                                        ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                        : 'text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <ScanLine className="w-5 h-5" />
                                Escanear QR
                            </Link>
                        </nav>

                        <div className="pt-6 border-t border-white/10">
                            <SignOutButton redirectUrl="/ops/login">
                                <button className="w-full flex items-center gap-3 p-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                                    <LogOut className="w-5 h-5" />
                                    Cerrar Sesión
                                </button>
                            </SignOutButton>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

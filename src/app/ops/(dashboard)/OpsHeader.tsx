'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldCheck, Menu, X, CheckSquare, ScanLine, LogOut, Home, User, ChevronDown, Building2, Store, ChevronRight } from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'
import { cn } from '@/lib/utils'

interface Membership {
    id: string
    jobTitle: string | null
    owner: {
        businessName: string | null
    }
}

export default function OpsHeader() {
    const [isOpen, setIsOpen] = useState(false)
    const [showBranchSwitcher, setShowBranchSwitcher] = useState(false)
    const [branchName, setBranchName] = useState<string>('Panel Operativo')
    const [currentMembershipId, setCurrentMembershipId] = useState<string | null>(null)
    const [allMemberships, setAllMemberships] = useState<Membership[]>([])
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        // Fetch branch name and all memberships from API
        fetch('/api/ops/session')
            .then(res => res.json())
            .then(data => {
                if (data?.member?.owner?.businessName) {
                    setBranchName(data.member.owner.businessName)
                    setCurrentMembershipId(data.member.id)
                }
                if (data?.allMemberships) {
                    setAllMemberships(data.allMemberships)
                }
            })
            .catch(err => console.error('Error fetching branch name:', err))
    }, [])

    const switchBranch = async (membershipId: string) => {
        try {
            const res = await fetch('/api/ops/switch-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ membershipId })
            })

            if (res.ok) {
                setShowBranchSwitcher(false)
                window.location.reload()
            }
        } catch (error) {
            console.error('Error switching branch:', error)
        }
    }

    return (
        <>
            {/* Header Bar */}
            <header className="h-20 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
                <button
                    onClick={() => allMemberships.length > 1 && setShowBranchSwitcher(true)}
                    className={`group relative flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 ${allMemberships.length > 1
                        ? 'bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 shadow-lg'
                        : 'bg-transparent border-transparent cursor-default'
                        }`}
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col items-start translate-y-[1px]">
                        <h1 className="font-black text-[10px] text-violet-400 uppercase tracking-[0.2em] leading-none mb-1">Sucursal Activa</h1>
                        <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-white tracking-tight">{branchName}</p>
                            {allMemberships.length > 1 && (
                                <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-violet-400 transition-colors" />
                            )}
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setIsOpen(true)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-200 transition-all duration-300"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Branch Switcher Modal */}
            {showBranchSwitcher && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowBranchSwitcher(false)}
                    />
                    <div className="relative w-full max-w-sm bg-[#0f1115]/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 pb-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-violet-600/10 flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                                <ShieldCheck className="w-8 h-8 text-violet-500" />
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tight">Cambiar Sucursal</h2>
                            <p className="text-gray-500 text-sm mt-1">Selecciona el centro operativo</p>
                        </div>

                        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {allMemberships.map((membership) => {
                                const bName = membership.owner?.businessName ||
                                    'Sucursal'
                                const isActive = membership.id === currentMembershipId

                                return (
                                    <button
                                        key={membership.id}
                                        onClick={() => switchBranch(membership.id)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 text-left group",
                                            isActive
                                                ? "bg-violet-600 border-violet-500 shadow-lg shadow-violet-600/20"
                                                : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105",
                                            isActive ? "bg-white/20" : "bg-[#1a1c22] border border-white/5"
                                        )}>
                                            <Store className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("font-bold tracking-tight truncate", isActive ? "text-white" : "text-gray-300")}>
                                                {bName}
                                            </p>
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-violet-100/70" : "text-gray-500")}>
                                                {isActive ? 'Activa ahora' : 'Cambiar a esta'}
                                            </p>
                                        </div>
                                        {!isActive && (
                                            <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="p-6 pt-2">
                            <button
                                onClick={() => setShowBranchSwitcher(false)}
                                className="w-full py-4 text-sm font-bold text-gray-500 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            {/* HOME LINK */}
                            <Link
                                href="/ops"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname === '/ops'
                                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                    : 'text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <Home className="w-5 h-5" />
                                Ir al Inicio
                            </Link>

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

                            {/* PROFILE LINK */}
                            <Link
                                href="/ops/profile-setup"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname.startsWith('/ops/profile-setup')
                                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                    : 'text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                Ver mi Perfil
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

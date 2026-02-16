'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldCheck, Menu, X, CheckSquare, ScanLine, LogOut, Home, User, ChevronDown, Building2 } from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'
import BrandLogo from '@/components/BrandLogo'

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
            <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-50">
                <button
                    onClick={() => allMemberships.length > 1 && setShowBranchSwitcher(true)}
                    className={`flex items-center gap-2 ${allMemberships.length > 1 ? 'hover:bg-white/5 rounded-lg px-2 py-1 -ml-2 transition-colors' : ''}`}
                >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm text-white leading-none">Ops</h1>
                        <div className="flex items-center gap-1">
                            <p className="text-[10px] text-slate-400 font-medium">{branchName}</p>
                            {allMemberships.length > 1 && (
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                            )}
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-200 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Branch Switcher Modal */}
            {showBranchSwitcher && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowBranchSwitcher(false)}
                    />
                    <div className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-lg font-bold text-white">Cambiar Sucursal</h2>
                            </div>
                            <button
                                onClick={() => setShowBranchSwitcher(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {allMemberships.map((membership) => (
                                <button
                                    key={membership.id}
                                    onClick={() => switchBranch(membership.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${membership.id === currentMembershipId
                                        ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-sm">{membership.owner.businessName}</div>
                                        <div className="text-xs text-slate-400">{membership.jobTitle || 'Personal'}</div>
                                    </div>
                                    {membership.id === currentMembershipId && (
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                                    )}
                                </button>
                            ))}
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

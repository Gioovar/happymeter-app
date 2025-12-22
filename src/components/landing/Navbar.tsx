'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { cn } from '@/lib/utils'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <header className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-[#050505]/60">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="hover:opacity-90 transition-opacity" onClick={() => setIsOpen(false)}>
                    <BrandLogo />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        href="/creators"
                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Para Creadores
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/sign-in"
                            className="text-sm font-medium text-white hover:text-violet-400 transition-colors"
                        >
                            Entrar
                        </Link>
                        <Link href="/sign-up">
                            <button className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95">
                                Crear Cuenta
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Menu"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden fixed inset-x-0 top-20 bg-[#050505] border-b border-white/10 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-5 fade-in-0 duration-200 z-40">
                    <nav className="flex flex-col gap-6">
                        <Link
                            href="/creators"
                            onClick={() => setIsOpen(false)}
                            className="text-lg font-medium text-gray-300 hover:text-white flex items-center justify-between group"
                        >
                            Para Creadores
                            <span className="text-gray-600 group-hover:text-white transition-colors">→</span>
                        </Link>

                        <div className="h-px bg-white/5" />

                        <Link
                            href="/sign-in"
                            onClick={() => setIsOpen(false)}
                            className="text-lg font-medium text-gray-300 hover:text-white"
                        >
                            Entrar
                        </Link>
                        <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                            <button className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                                Crear Cuenta
                            </button>
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown, Sparkles } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { cn } from '@/lib/utils'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const NavLink = ({ href, children, isNew }: { href: string; children: React.ReactNode; isNew?: boolean }) => (
        <Link
            href={href}
            className="group relative h-full flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
            {children}
            {isNew && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full text-white animate-pulse">
                    NEW
                </span>
            )}
            {/* Animated Underline */}
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
        </Link>
    )

    return (
        <header
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-500",
                scrolled
                    ? "bg-[#050505]/70 backdrop-blur-2xl border-b border-white/5 py-3 shadow-[0_0_40px_-10px_rgba(139,92,246,0.1)]"
                    : "bg-transparent py-5"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="relative z-50 hover:opacity-90 transition-opacity" onClick={() => setIsOpen(false)}>
                    <BrandLogo />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    <div className="flex items-center gap-8 px-8 py-2.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                        <NavLink href="/pricing">Precios</NavLink>
                        <NavLink href="/blog" isNew>Blog</NavLink>
                        <NavLink href="/blog/guia-digitalizar-feedback">Tutoriales</NavLink> {/* Direct link to guide or /tutorials if it existed */}
                        <NavLink href="mailto:soporte@happymeter.app">Ayuda</NavLink>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        href="/sign-in"
                        className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                        Entrar
                    </Link>
                    <Link href="/sign-up" className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-200" />
                        <button className="relative px-6 py-2.5 rounded-full bg-black border border-white/10 text-white text-sm font-bold flex items-center gap-2 group-hover:bg-[#0a0a0a] transition-colors">
                            <Sparkles className="w-3 h-3 text-fuchsia-400" />
                            Empezar Gratis
                        </button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden relative z-50 p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={cn(
                "fixed inset-0 bg-[#050505] z-40 md:hidden transition-transform duration-300 ease-in-out pt-32 px-6",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col gap-8">
                    <div className="space-y-6">
                        <Link href="/pricing" onClick={() => setIsOpen(false)} className="block text-2xl font-bold text-white hover:text-violet-400">
                            Precios
                        </Link>
                        <Link href="/blog" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-2xl font-bold text-white hover:text-violet-400">
                            Blog
                            <span className="px-2 py-0.5 text-xs bg-violet-600 rounded-full text-white">NEW</span>
                        </Link>
                        <Link href="/blog/guia-digitalizar-feedback" onClick={() => setIsOpen(false)} className="block text-2xl font-bold text-white hover:text-violet-400">
                            Tutoriales
                        </Link>
                        <Link href="mailto:soporte@happymeter.app" onClick={() => setIsOpen(false)} className="block text-2xl font-bold text-white hover:text-violet-400">
                            Ayuda y Soporte
                        </Link>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="space-y-4">
                        <Link href="/sign-in" onClick={() => setIsOpen(false)} className="block w-full py-4 text-center text-gray-400 font-medium hover:text-white">
                            Iniciar Sesión
                        </Link>
                        <Link href="/sign-up" onClick={() => setIsOpen(false)} className="block w-full py-4 text-center bg-white text-black font-bold rounded-xl active:scale-95 transition-transform">
                            Crear Cuenta Gratis
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}

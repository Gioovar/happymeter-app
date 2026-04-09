'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X, ChevronDown, Sparkles } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { cn } from '@/lib/utils'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Handle mobile menu scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

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
        <>
            <header
                className={cn(
                    "fixed top-0 w-full z-[8000] transition-all duration-500",
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
                        <NavLink href="/blog/guia-digitalizar-feedback">Tutoriales</NavLink>
                        <NavLink href="/creators" isNew>Únete</NavLink>

                        <NavLink href="mailto:soporte@happymeters.com">Ayuda</NavLink>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="/sign-in?intent=view_pricing" className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-200" />
                        <button className="relative px-6 py-2.5 rounded-full bg-black border border-white/10 text-white text-sm font-bold flex items-center gap-2 group-hover:bg-[#0a0a0a] transition-colors">
                            <Sparkles className="w-3 h-3 text-fuchsia-400" />
                            Iniciar sesión
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

            </header>

            {/* Mobile Menu Portal Overlay */}
            {mounted && createPortal(
                <div className={cn(
                    "fixed top-0 left-0 w-[100vw] h-[100vh] bg-black z-[9999] md:hidden transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}>
                    {/* Header inside Overlay */}
                    <div className="flex-none flex items-center justify-between px-6 py-5">
                        <Link href="/" className="relative z-50 hover:opacity-90 transition-opacity" onClick={() => setIsOpen(false)}>
                            <BrandLogo />
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 -mr-2 text-gray-400 hover:text-white bg-white/5 rounded-full active:scale-95 transition-all"
                            aria-label="Cerrar Menu"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
                        <div className="flex flex-col gap-10">
                            
                            {/* Section 1: Navigation */}
                            <div className="flex flex-col gap-3">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-4">Explorar</span>
                                <Link href="/pricing" onClick={() => setIsOpen(false)} className="flex items-center w-full px-5 py-4 rounded-2xl bg-[#111111] hover:bg-[#1a1a1a] active:scale-95 transition-all text-xl font-bold text-white">
                                    Precios
                                </Link>
                                <Link href="/blog" onClick={() => setIsOpen(false)} className="flex items-center justify-between w-full px-5 py-4 rounded-2xl bg-[#111111] hover:bg-[#1a1a1a] active:scale-95 transition-all text-xl font-bold text-white">
                                    <span>Blog</span>
                                    <span className="px-2.5 py-1 text-[10px] font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full text-white">NUEVO</span>
                                </Link>
                                <Link href="/blog/guia-digitalizar-feedback" onClick={() => setIsOpen(false)} className="flex items-center w-full px-5 py-4 rounded-2xl bg-[#111111] hover:bg-[#1a1a1a] active:scale-95 transition-all text-xl font-bold text-white">
                                    Tutoriales
                                </Link>
                            </div>

                            {/* Section 2: Actions */}
                            <div className="flex flex-col gap-3">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-4">Plataforma</span>
                                <Link href="/creators" onClick={() => setIsOpen(false)} className="flex items-center justify-between w-full px-5 py-4 rounded-2xl bg-[#111111] hover:bg-[#1a1a1a] active:scale-95 transition-all text-xl font-bold text-white">
                                    <span>Únete a HappyMeter</span>
                                    <span className="px-2.5 py-1 text-[10px] font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full text-white">NUEVO</span>
                                </Link>
                                <Link href="/sign-in?intent=view_pricing" onClick={() => setIsOpen(false)} className="flex items-center w-full px-5 py-4 rounded-2xl bg-[#111111] hover:bg-[#1a1a1a] active:scale-95 transition-all text-xl font-bold text-white">
                                    Iniciar Sesión
                                </Link>
                            </div>

                            {/* Section 3: Support */}
                            <div className="flex flex-col gap-3">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-4">Soporte</span>
                                <Link href="mailto:soporte@happymeters.com" onClick={() => setIsOpen(false)} className="flex items-center w-full px-5 py-4 rounded-2xl bg-[#111111] hover:bg-[#1a1a1a] active:scale-95 transition-all text-xl font-bold text-white">
                                    Ayuda y Soporte
                                </Link>
                            </div>

                        </div>
                    </div>

                    {/* Fixed Bottom Action */}
                    <div className="flex-none p-6 pb-10 bg-black/90 border-t border-white/5 sm:pb-8">
                        <Link href="/sign-up?intent=view_pricing" onClick={() => setIsOpen(false)} className="flex items-center justify-center w-full py-5 text-center bg-white text-black text-[19px] font-extrabold rounded-2xl active:scale-95 transition-transform">
                            Crear Cuenta Gratis
                        </Link>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

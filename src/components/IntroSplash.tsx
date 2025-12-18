'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function IntroSplash() {
    const [isVisible, setIsVisible] = useState(true)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        // Prevent scroll when visible
        if (isVisible) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        // Hide after animation (e.g., 5s to enjoy the matrix)
        const timer = setTimeout(() => {
            setIsVisible(false)
        }, 5000)

        return () => clearTimeout(timer)
    }, [isVisible])

    // Matrix Rain Effect
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ' // Tech/Code feel
        const charArray = chars.split('')

        const fontSize = 14
        const columns = canvas.width / fontSize

        const drops: number[] = []
        for (let i = 0; i < columns; i++) {
            drops[i] = 1
        }

        const draw = () => {
            // Semi-transparent black to create trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.fillStyle = '#8b5cf6' // Violet-500 (Brand Color)
            ctx.font = `${fontSize}px monospace`

            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)]

                // Randomly vary color for depth (some white, mostly purple)
                if (Math.random() > 0.98) {
                    ctx.fillStyle = '#ffffff'
                } else {
                    ctx.fillStyle = '#8b5cf6'
                }

                ctx.fillText(text, i * fontSize, drops[i] * fontSize)

                // Reset drop to top randomly
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0
                }

                drops[i]++
            }
        }

        const interval = setInterval(draw, 33)

        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        window.addEventListener('resize', handleResize)

        return () => {
            clearInterval(interval)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    const container = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.5
            }
        }
    }

    const letter = {
        hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)' }
    }

    const text = "Todo lo que tú no ves y no te reportan,\nHappyMeter te lo dice."

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                    exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 text-center select-none overflow-hidden"
                >
                    {/* Matrix Background */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 z-0 opacity-40"
                    />

                    {/* Gradient Overlay for Vignette */}
                    <div className="absolute inset-0 z-0 bg-gradient-radial from-transparent to-black opacity-80" />

                    <div className="relative z-10 max-w-5xl px-4">
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="flex flex-col items-center gap-4 md:gap-6"
                        >
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="flex flex-col items-center gap-6"
                            >
                                <motion.h2
                                    variants={letter}
                                    className="text-2xl md:text-4xl lg:text-5xl font-medium text-gray-400 tracking-tight leading-normal"
                                >
                                    Todo lo que tú no ves y no te reportan,
                                </motion.h2>

                                <motion.h1
                                    variants={letter}
                                    className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter"
                                >
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-white">
                                        HappyMeter
                                    </span>
                                    <span className="text-white"> te lo dice.</span>
                                </motion.h1>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Futuristic Loader Line at bottom */}
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "200px", opacity: 1 }}
                        transition={{ duration: 3, ease: 'linear', delay: 0.5 }}
                        className="absolute bottom-20 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

'use client'

import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = canvas.width = window.innerWidth
        let height = canvas.height = window.innerHeight

        let mouseX = -1000 // Start off screen
        let mouseY = -1000

        // Configuration for "Subtle Authority"
        const density = 6000 // larger area per particle = fewer particles
        const particleCount = Math.floor((width * height) / density) // Responsive count (~150 on desktop)
        const connectionDist = 120 // Range for synaptic lines

        const particles: Particle[] = []

        class Particle {
            x: number
            y: number
            vx: number
            vy: number
            size: number
            color: string
            phase: number // For sine wave wobble

            constructor() {
                this.x = Math.random() * width
                this.y = Math.random() * height

                // Slow, upward drift like bubbles or heat data
                this.vx = (Math.random() - 0.5) * 0.2
                this.vy = Math.random() * -0.5 - 0.1 // Always Up (-y)

                this.size = Math.random() * 2 + 0.5 // varied fine sizes
                this.phase = Math.random() * Math.PI * 2

                // Brand Colors (Violet / Cyan) but faint
                // Using HSLA for better control
                const isViolet = Math.random() > 0.4
                // Violet (260ish) or Cyan (180ish)
                const hue = isViolet ? 260 : 190
                this.color = `hsla(${hue}, 80%, 70%, `
            }

            update(time: number) {
                // 1. Movement
                this.y += this.vy
                this.x += this.vx + Math.sin(time * 0.001 + this.phase) * 0.1 // Gentle sway

                // 2. Wrap around properties
                // If it goes off top, respawn at bottom
                if (this.y < -10) {
                    this.y = height + 10
                    this.x = Math.random() * width
                }
                // Horizontal wrap
                if (this.x > width + 10) this.x = -10
                if (this.x < -10) this.x = width + 10

                // 3. Mouse Interaction (Gentle Repel)
                const dx = this.x - mouseX
                const dy = this.y - mouseY
                const dist = Math.sqrt(dx * dx + dy * dy)
                const mouseRadius = 150

                if (dist < mouseRadius) {
                    const force = (mouseRadius - dist) / mouseRadius
                    const angle = Math.atan2(dy, dx)

                    // Very gentle push
                    this.x += Math.cos(angle) * force * 1
                    this.y += Math.sin(angle) * force * 1
                }
            }

            draw(opacity: number) {
                if (!ctx) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = this.color + opacity + ')' // Complete the hsla string
                ctx.fill()
            }
        }

        // Init
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle())
        }

        let time = 0
        const animate = () => {
            ctx.clearRect(0, 0, width, height)
            time += 16 // roughly 60fps ms

            // Draw Connections First (Background layer)
            ctx.lineWidth = 0.5

            // Nested loop optimized for N < 200
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i]
                p1.update(time)

                // Check neighbors
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j]
                    const dx = p1.x - p2.x
                    const dy = p1.y - p2.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < connectionDist) {
                        const alpha = 1 - (dist / connectionDist)
                        // Very subtle lines
                        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.15})`
                        ctx.beginPath()
                        ctx.moveTo(p1.x, p1.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.stroke()
                    }
                }

                // Draw Particle
                // Opacity pulses slightly for twinkling
                const pulse = Math.sin(time * 0.002 + p1.phase) * 0.2 + 0.6
                p1.draw(pulse)
            }

            requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }

        const handleMouseMove = (e: MouseEvent) => {
            // Add slight lag or smoothing if desired, but direct is fine for this
            mouseX = e.clientX
            mouseY = e.clientY
        }

        const handleMouseLeave = () => {
            mouseX = -1000
            mouseY = -1000
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
                // Subtle gradient base - matches site theme
                background: 'radial-gradient(circle at 50% 50%, #0a0a0a 0%, #000 100%)'
            }}
        />
    )
}

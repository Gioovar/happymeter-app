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

        let mouseX = width / 2
        let mouseY = height / 2

        const particles: Particle[] = []
        // Higher density for the head mesh
        const particleCount = window.innerWidth < 768 ? 100 : 250
        const connectionDistance = 100 // Tighter connections for the head

        // Head definition
        const headWidth = Math.min(width * 0.35, 300)
        const headHeight = headWidth * 1.4

        class Particle {
            x: number
            y: number
            originX: number
            originY: number
            vx: number
            vy: number
            size: number
            color: string
            isHead: boolean

            constructor(forceHead: boolean = false) {
                // Determine if particle is part of the Head or the Aura
                // 80% chance to be part of the head structure
                this.isHead = forceHead || Math.random() > 0.2

                if (this.isHead) {
                    // Spawn inside the Head Ellipse
                    const angle = Math.random() * Math.PI * 2
                    // Distribute more towards surface for contour, but some inside for volume
                    const radiusScale = Math.sqrt(Math.random())
                    const rx = (headWidth / 2) * radiusScale
                    const ry = (headHeight / 2) * radiusScale

                    this.originX = width / 2 + Math.cos(angle) * rx
                    this.originY = height / 2 + Math.sin(angle) * ry
                } else {
                    // Spawn randomly for background 'circuit' feel
                    this.originX = Math.random() * width
                    this.originY = Math.random() * height
                }

                this.x = this.originX
                this.y = this.originY

                // Micro-movement (vibration/alive feel)
                this.vx = (Math.random() - 0.5) * 0.5
                this.vy = (Math.random() - 0.5) * 0.5

                this.size = Math.random() * 1.5 + 0.5

                // Tech colors: Cyan/Blue mix with Violet
                const isBlue = Math.random() > 0.5
                this.color = isBlue
                    ? `rgba(6, 182, 212, ${Math.random() * 0.5 + 0.3})` // Cyan
                    : `rgba(139, 92, 246, ${Math.random() * 0.5 + 0.3})` // Violet
            }

            update() {
                // Jitter around origin
                this.x += this.vx
                this.y += this.vy

                // Tether to origin (spring force)
                const dx = this.originX - this.x
                const dy = this.originY - this.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist > 10) {
                    this.vx += dx * 0.005
                    this.vy += dy * 0.005
                }

                // Damping
                this.vx *= 0.95
                this.vy *= 0.95
            }

            draw() {
                if (!ctx) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = this.color
                ctx.fill()
            }
        }

        // Init particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle())
        }

        const drawEye = (centerX: number, centerY: number, size: number) => {
            if (!ctx) return

            // Eye Glow
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 2)
            gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)')
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0)')
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(centerX, centerY, size * 2, 0, Math.PI * 2)
            ctx.fill()

            // Sclera (Frame)
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)' // Cyan
            ctx.lineWidth = 1.5
            ctx.beginPath()
            // Techno-shape (slightly hexagonal or bracketed)
            ctx.moveTo(centerX - size, centerY)
            ctx.lineTo(centerX - size * 0.5, centerY - size * 0.7)
            ctx.lineTo(centerX + size * 0.5, centerY - size * 0.7)
            ctx.lineTo(centerX + size, centerY)
            ctx.lineTo(centerX + size * 0.5, centerY + size * 0.7)
            ctx.lineTo(centerX - size * 0.5, centerY + size * 0.7)
            ctx.closePath()
            ctx.stroke()

            // Pupil Tracking
            const angle = Math.atan2(mouseY - centerY, mouseX - centerX)
            // Limit pupil movement radius
            const pupilRadius = size * 0.4
            const pupilX = centerX + Math.cos(angle) * pupilRadius
            const pupilY = centerY + Math.sin(angle) * pupilRadius

            // Pupil Draw
            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(pupilX, pupilY, 2, 0, Math.PI * 2)
            ctx.fill()

            // Connecting line to mouse (Targeting system look)
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)'
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(pupilX, pupilY)
            ctx.lineTo(mouseX, mouseY)
            ctx.stroke()
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            // 1. Draw Mesh & Particles
            particles.forEach(particle => {
                particle.update()
                // particle.draw() // Optional: Only draw particles if they connect, or draw faint

                // Draw Connections
                // Optimization: Check only nearby particles
                // For a simple aesthetic, brute force on small count is fine, 
                // but let's just loop locally if possible. 
                // Given N=250, N^2 is 62,500 ops per frame, manageable on modern desktop.
                // On mobile we reduced N.
            })

            // Draw Mesh (The Neural Brain)
            ctx.lineWidth = 0.8
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i]

                // Draw particle (nodes)
                ctx.beginPath()
                ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2)
                ctx.fillStyle = p1.color
                ctx.fill()

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j]
                    const dx = p1.x - p2.x
                    const dy = p1.y - p2.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < connectionDistance) {
                        ctx.beginPath()

                        // Opacity logic:
                        // Make connections inside the head stronger
                        const alpha = (1 - dist / connectionDistance) * 0.3

                        ctx.strokeStyle = p1.isHead && p2.isHead
                            ? `rgba(6, 182, 212, ${alpha})` // Cyan internal structure
                            : `rgba(139, 92, 246, ${alpha * 0.5})` // Violet outer connections

                        ctx.moveTo(p1.x, p1.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.stroke()
                    }
                }
            }

            // 2. Draw The EYES (Overlay on top of mesh)
            const eyeSpacing = headWidth * 0.35 // Distance between eyes
            const eyeYLevel = height / 2 - headHeight * 0.05 // Slightly above center

            drawEye(width / 2 - eyeSpacing, eyeYLevel, 12) // Left Eye
            drawEye(width / 2 + eyeSpacing, eyeYLevel, 12) // Right Eye

            requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
            // Need to re-init particles to center them? 
            // For now, let's just update bounds. Ideally we respawn.
        }

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouseX = e.clientX - rect.left
            mouseY = e.clientY - rect.top
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('mousemove', handleMouseMove)

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
                // Deep cyber background
                background: 'radial-gradient(circle at center, #020617 0%, #000 100%)'
            }}
        />
    )
}

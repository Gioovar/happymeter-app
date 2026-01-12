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

        const particles: Particle[] = []
        // Adjust density based on screen size
        const particleCount = window.innerWidth < 768 ? 40 : 80
        const connectionDistance = 150
        const mouseDistance = 250

        let mouseX = -1000 // Start off screen
        let mouseY = -1000

        class Particle {
            x: number
            y: number
            vx: number
            vy: number
            size: number
            color: string

            constructor() {
                this.x = Math.random() * width
                this.y = Math.random() * height
                // Slower, smoother movement
                this.vx = (Math.random() - 0.5) * 0.3
                this.vy = (Math.random() - 0.5) * 0.3
                this.size = Math.random() * 2 + 1
                // Brand colors: Violet to Fuchsia mix
                this.color = Math.random() > 0.5
                    ? `rgba(139, 92, 246, ${Math.random() * 0.6 + 0.2})` // Violet-500
                    : `rgba(217, 70, 239, ${Math.random() * 0.6 + 0.2})` // Fuchsia-500
            }

            update() {
                this.x += this.vx
                this.y += this.vy

                // Bounce off edges smoothly
                if (this.x < 0 || this.x > width) this.vx *= -1
                if (this.y < 0 || this.y > height) this.vy *= -1

                // Mouse interaction (Magnetic Effect)
                const dx = mouseX - this.x
                const dy = mouseY - this.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < mouseDistance) {
                    const forceDirectionX = dx / distance
                    const forceDirectionY = dy / distance
                    const force = (mouseDistance - distance) / mouseDistance

                    // Gentle attraction
                    const attractionStrength = 0.5
                    this.vx += forceDirectionX * force * attractionStrength * 0.05
                    this.vy += forceDirectionY * force * attractionStrength * 0.05
                }
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

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            // Update and draw particles
            particles.forEach(particle => {
                particle.update()
                particle.draw()
            })

            // Draw connections (The Neural Network)
            for (let i = 0; i < particles.length; i++) {
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < connectionDistance) {
                        ctx.beginPath()
                        // Opacity based on distance (closer = clearer)
                        const opacity = 1 - (distance / connectionDistance)
                        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity * 0.2})` // Subtle violet lines
                        ctx.lineWidth = 1
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.stroke()
                    }
                }
            }

            requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouseX = e.clientX - rect.left
            mouseY = e.clientY - rect.top
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
                // Subtle dark gradient background
                background: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)'
            }}
        />
    )
}

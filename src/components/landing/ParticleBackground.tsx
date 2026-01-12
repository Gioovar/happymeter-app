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

        // "Magnetic" Center (Lagging behind mouse)
        let centerX = width / 2
        let centerY = height / 2

        const particleCount = 3000
        const particles: Particle[] = []

        class Particle {
            x: number
            y: number
            radius: number
            angle: number
            speed: number
            size: number
            color: string
            orbitRadius: number

            constructor() {
                // Initial distribution
                this.x = Math.random() * width
                this.y = Math.random() * height

                // Polar coordinates relative to center
                this.orbitRadius = Math.random() * Math.max(width, height) * 0.8
                this.angle = Math.random() * Math.PI * 2

                // Speed is faster near center (Kepler) but clamped
                this.speed = (0.005 + (1 - this.orbitRadius / Math.max(width, height)) * 0.01) * (Math.random() > 0.5 ? 1 : 1)

                this.size = Math.random() * 2 + 1
            }

            update() {
                // Update Angle (Orbit)
                this.angle += this.speed

                // Calculate Target Position based on Orbit
                // The "Center" moves, so we calculate position relative to that
                const targetX = centerX + Math.cos(this.angle) * this.orbitRadius
                const targetY = centerY + Math.sin(this.angle) * this.orbitRadius

                // Ease towards ideal orbit position (Fluidity)
                this.x += (targetX - this.x) * 0.1
                this.y += (targetY - this.y) * 0.1
            }

            draw() {
                if (!ctx) return

                // Calculate velocity vector for orientation
                // V ≈ current - previous, but we know exact orbital tangent
                // Tangent vector: (-sin(angle), cos(angle))

                // Dash Length based on distance from center (faster = longer)
                const dashLen = 5 + (200 / (this.orbitRadius + 50)) * 5

                // Calculate tail position
                // The particle looks "forward" along the tangent
                const tailX = this.x - Math.cos(this.angle + Math.PI / 2) * dashLen
                const tailY = this.y - Math.sin(this.angle + Math.PI / 2) * dashLen

                ctx.beginPath()
                ctx.strokeStyle = '#4285F4' // Google Blue / Brand Blue
                ctx.lineWidth = this.size < 1.5 ? 1 : 2
                ctx.lineCap = 'round'
                ctx.globalAlpha = Math.min(1, 200 / (this.orbitRadius + 10)) // Fade out at edges

                ctx.moveTo(this.x, this.y)
                // Actually, tangent is perpendicular to radius.
                // If angle is 0 (right), tangent is down (PI/2)
                const rot = this.angle + Math.PI / 2

                const endX = this.x + Math.cos(rot) * dashLen * (this.speed > 0 ? 1 : -1)
                const endY = this.y + Math.sin(rot) * dashLen * (this.speed > 0 ? 1 : -1)

                ctx.lineTo(endX, endY)
                ctx.stroke()
                ctx.globalAlpha = 1
            }
        }

        // Init
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle())
        }

        const animate = () => {
            // Trail Effect (partial clear)
            // Creates the blur/motion smear
            ctx.fillStyle = 'rgba(2, 6, 23, 0.3)' // Dark background with trail
            ctx.fillRect(0, 0, width, height)

            // Update Virtual Center (Magnetic Mouse)
            centerX += (mouseX - centerX) * 0.05
            centerY += (mouseY - centerY) * 0.05

            particles.forEach(p => {
                p.update()
                p.draw()
            })

            requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY
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
            className="absolute inset-0 w-full h-full point-events-none"
            style={{
                // Solid background color ensures trails work
                background: '#020617'
            }}
        />
    )
}

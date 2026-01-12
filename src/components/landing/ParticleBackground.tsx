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

        let mouseX = 0
        let mouseY = 0

        // Config
        const particleCount = 4000 // Dense but performant
        const particles: Particle[] = []

        class Particle {
            x: number
            y: number
            z: number
            radius: number
            theta: number
            phi: number
            speed: number
            originalRadius: number

            constructor() {
                // Spherical Distribution
                // Distribute more particles near the surface of the sphere for the "Shell" look
                // But also some internal volume

                this.originalRadius = Math.random() * 800 + 100 // Spread out
                this.radius = this.originalRadius

                this.theta = Math.random() * Math.PI * 2 // Angle round X
                this.phi = Math.acos((Math.random() * 2) - 1) // Angle round Y

                this.speed = Math.random() * 0.002 + 0.001

                // Convert spherical to cartesian for initial check (optional)
            }

            update(time: number, rotX: number, rotY: number) {
                // 1. Orbital Rotation
                this.theta += this.speed

                // 2. Breathing / Pulsing (Vortex effect)
                // Particles drift in and out slightly
                this.radius = this.originalRadius + Math.sin(time * 2 + this.originalRadius * 0.01) * 20

                // 3. Convert Spherical -> Cartesian
                this.x = this.radius * Math.sin(this.phi) * Math.cos(this.theta)
                this.y = this.radius * Math.sin(this.phi) * Math.sin(this.theta)
                this.z = this.radius * Math.cos(this.phi)

                // 4. Global Rotation (Mouse)
                // Rotate around Y
                const cosY = Math.cos(rotY)
                const sinY = Math.sin(rotY)
                let x1 = this.x * cosY - this.z * sinY
                let z1 = this.z * cosY + this.x * sinY

                // Rotate around X
                const cosX = Math.cos(rotX)
                const sinX = Math.sin(rotX)
                let y1 = this.y * cosX - z1 * sinX
                let z2 = z1 * cosX + this.y * sinX

                this.x = x1
                this.y = y1
                this.z = z2
            }
        }

        // Init
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle())
        }

        let time = 0

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            // Camera
            const focalLength = 400
            const centerX = width / 2
            const centerY = height / 2

            // Mouse Target Rotation (Smooth drift)
            let targetRotX = (mouseY / height - 0.5) * 1.5 // Full tilt
            let targetRotY = (mouseX / width - 0.5) * 1.5 // Full pan

            // Auto rotation base
            targetRotY += time * 0.2

            time += 0.005

            // Draw Order: Sort by Z depth
            // Essential for a sphere to look solid
            // particles.sort((a, b) => b.z - a.z) // Expensive every frame? 4000 is okay.

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i]
                p.update(time, targetRotX, targetRotY)

                const zDepth = p.z + 1000 // Push camera back

                if (zDepth > 0) {
                    const scale = focalLength / zDepth
                    const x = centerX + p.x * scale
                    const y = centerY + p.y * scale

                    const size = Math.max(0.2, 1.5 * scale)
                    const alpha = Math.max(0, 1 - (zDepth / 2000))

                    ctx.beginPath()
                    // Color from reference: Cool Blue/White
                    ctx.fillStyle = `rgba(165, 180, 252, ${alpha})`
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()
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
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
                // Deep void
                background: 'radial-gradient(circle at center, #020617 0%, #000 100%)'
            }}
        />
    )
}

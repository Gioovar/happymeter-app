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

        // Configuration - ETHEREAL CLOUD
        const particleCount = 1500 // Reduced for "separadas"
        // "Ocupen la pantalla completa": Radius is now dynamic based on screen size
        let baseRadius = Math.min(width, height) * 0.45

        // Particles
        const particles: Particle[] = []

        class Particle {
            theta: number
            phi: number
            x: number
            y: number
            z: number
            originalTheta: number
            originalPhi: number

            constructor(index: number, total: number) {
                // Fibonacci Sphere Distribution (Even spacing)
                const phi = Math.acos(1 - 2 * (index + 0.5) / total)
                const theta = Math.PI * (1 + Math.sqrt(5)) * index

                this.originalTheta = theta
                this.originalPhi = phi
                this.theta = theta
                this.phi = phi

                this.x = 0
                this.y = 0
                this.z = 0
            }

            update(time: number, rotX: number, rotY: number) {
                // 1. "Weird Shapes" that "Rice" (Sube)
                // We simulate rising liquid by offsetting time based on Y position

                // Complex Noise Function for "Formas Raras"
                const freq = 3
                const amp = 60 // Larger amplitude for larger sphere

                // Primary rising wave (Vertical flow)
                // using originalTheta (Y-ish) to drive the phase
                const risingPhase = time * 2 - this.originalTheta * 2

                let distortion = Math.sin(this.originalPhi * freq + risingPhase) * amp

                // Secondary chaotic wave (The "Weird" part)
                distortion += Math.sin(this.originalTheta * 5 + time * 3) * (amp * 0.5)

                // Apply distortion to radius
                let r = baseRadius + distortion

                // 2. Cartesian Conversion
                let x = r * Math.sin(this.phi) * Math.cos(this.theta)
                let y = r * Math.sin(this.phi) * Math.sin(this.theta)
                let z = r * Math.cos(this.phi)

                // 3. Rotation (Trackball)
                // Rotate around Y
                const cosY = Math.cos(rotY)
                const sinY = Math.sin(rotY)
                const x1 = x * cosY - z * sinY
                const z1 = z * cosY + x * sinY

                // Rotate around X
                const cosX = Math.cos(rotX)
                const sinX = Math.sin(rotX)
                const y1 = y * cosX - z1 * sinX
                const z2 = z1 * cosX + y * sinX

                this.x = x1
                this.y = y1
                this.z = z2
            }
        }

        // Init Particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(i, particleCount))
        }

        let time = 0
        let targetRotX = 0
        let targetRotY = 0

        const animate = () => {
            // Clear with transparent black to avoid trails
            ctx.clearRect(0, 0, width, height)

            time += 0.015

            // Smooth Rotation Smoothing
            // Map mouse to rotation angles
            const targetX = (mouseY / height - 0.5) * Math.PI // -PI/2 to PI/2
            const targetY = (mouseX / width - 0.5) * Math.PI // -PI/2 to PI/2

            targetRotX += (targetX - targetRotX) * 0.05
            targetRotY += (targetY - targetRotY) * 0.05

            // Add auto-spin
            const autoSpin = time * 0.2

            // Render
            const focalLength = 600
            const centerX = width / 2
            const centerY = height / 2

            // Sort particles for Z-order (Painter's algorithm)
            // Essential for gradient sphere look
            // We update positions first, then sort, then draw

            // First Update loop
            particles.forEach(p => {
                p.update(time, targetRotX, targetRotY + autoSpin)
            })

            // Sort
            particles.sort((a, b) => b.z - a.z)

            // Draw Loop
            particles.forEach(p => {
                // Projection
                const zDepth = p.z + 1000 // Push back more since it's huge now
                const scale = focalLength / zDepth

                const projX = centerX + p.x * scale
                const projY = centerY + p.y * scale

                // Dynamic Color Gradient
                // Map X position to Color Range (Cyan <-> Magenta)
                // Normalize X (-radius to +radius) roughly -1 to 1
                // Actually use original sphere coordinates for consistent surface color vs lighting effect?
                // The reference shows lighting. Let's use Z-depth for brightness and X for Hue.

                if (zDepth > 0) {
                    // Normalize position for color mix
                    const normalizedX = Math.max(-1, Math.min(1, p.x / (baseRadius * 1.2)))

                    // Cyan: 180-200, Magenta: 300
                    // Mix: Let's interpolate RGB
                    // Cyan: [6, 182, 212]
                    // Magenta: [217, 70, 239]

                    const t = (normalizedX + 1) / 2 // 0 to 1

                    const r = Math.floor(6 * (1 - t) + 217 * t) // Cyan -> Magenta
                    const g = Math.floor(182 * (1 - t) + 70 * t)
                    const b = Math.floor(212 * (1 - t) + 239 * t)

                    // FINENESS & OPACITY TUNING
                    // "Opacidad mas baja" -> Max opacity 0.6
                    const alpha = Math.max(0.1, (1 - (p.z / 800)) * 0.5)

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

                    // "Mas finas" -> Smaller size
                    const size = scale * 1.2 // Was 2.5

                    ctx.beginPath()
                    ctx.arc(projX, projY, size, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
            baseRadius = Math.min(width, height) * 0.45
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
                background: '#020617'
            }}
        />
    )
}

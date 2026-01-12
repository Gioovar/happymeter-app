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

        // Configuration
        const sphereParticleCount = 1500
        const dustParticleCount = 2000 // New "Full Width" particles
        let baseRadius = Math.min(width, height) * 0.45

        // Particles
        const sphereParticles: SphereParticle[] = []
        const dustParticles: DustParticle[] = []

        class SphereParticle {
            theta: number
            phi: number
            x: number
            y: number
            z: number
            originalTheta: number
            originalPhi: number

            constructor(index: number, total: number) {
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
                const freq = 3
                const amp = 60
                const risingPhase = time * 2 - this.originalTheta * 2
                let distortion = Math.sin(this.originalPhi * freq + risingPhase) * amp
                distortion += Math.sin(this.originalTheta * 5 + time * 3) * (amp * 0.5)
                let r = baseRadius + distortion

                let x = r * Math.sin(this.phi) * Math.cos(this.theta)
                let y = r * Math.sin(this.phi) * Math.sin(this.theta)
                let z = r * Math.cos(this.phi)

                const cosY = Math.cos(rotY)
                const sinY = Math.sin(rotY)
                const x1 = x * cosY - z * sinY
                const z1 = z * cosY + x * sinY

                const cosX = Math.cos(rotX)
                const sinX = Math.sin(rotX)
                const y1 = y * cosX - z1 * sinX
                const z2 = z1 * cosX + y * sinX

                this.x = x1
                this.y = y1
                this.z = z2
            }
        }

        // NEW: Hidden Dust Particles ("Aparecen cuando pasas el maus")
        class DustParticle {
            x: number
            y: number
            z: number
            vx: number
            vy: number

            constructor() {
                // Random Full Volume Distribution
                this.x = (Math.random() - 0.5) * width * 2 // Wide spread
                this.y = (Math.random() - 0.5) * height * 2
                this.z = (Math.random() - 0.5) * 1000 // Deep depth

                this.vx = (Math.random() - 0.5) * 0.5
                this.vy = Math.random() * -1 - 0.2 // Always rising slightly
            }

            update() {
                this.x += this.vx
                this.y += this.vy

                // Wrap around
                const boundW = width
                const boundH = height

                if (this.y < -boundH) this.y = boundH
                if (this.x > boundW) this.x = -boundW
                if (this.x < -boundW) this.x = boundW
            }
        }

        // Init Sphere
        for (let i = 0; i < sphereParticleCount; i++) {
            sphereParticles.push(new SphereParticle(i, sphereParticleCount))
        }

        // Init Dust
        for (let i = 0; i < dustParticleCount; i++) {
            dustParticles.push(new DustParticle())
        }

        let time = 0
        let targetRotX = 0
        let targetRotY = 0

        const animate = () => {
            // Clear with transparent black to avoid trails
            ctx.clearRect(0, 0, width, height)

            time += 0.015

            // Smooth Rotation
            const targetX = (mouseY / height - 0.5) * Math.PI
            const targetY = (mouseX / width - 0.5) * Math.PI

            targetRotX += (targetX - targetRotX) * 0.05
            targetRotY += (targetY - targetRotY) * 0.05
            const autoSpin = time * 0.2

            const focalLength = 600
            const centerX = width / 2
            const centerY = height / 2

            // 1. Draw Dust (Background Layer)
            // No sorting needed for dust as it's faint
            dustParticles.forEach(p => {
                p.update()

                // Projection
                const zDepth = p.z + 1000
                if (zDepth <= 0) return

                const scale = focalLength / zDepth
                const projX = centerX + p.x * scale
                const projY = centerY + p.y * scale

                // Reveal Logic: Distance to Mouse
                const dx = projX - mouseX
                const dy = projY - mouseY
                const dist = Math.sqrt(dx * dx + dy * dy)
                const revealRadius = 200

                if (dist < revealRadius) {
                    // Alpha is 1 at center, 0 at edge
                    const alpha = (1 - dist / revealRadius) * 0.6

                    ctx.fillStyle = `rgba(165, 180, 252, ${alpha})` // Indigo
                    ctx.beginPath()
                    ctx.arc(projX, projY, scale * 1.5, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            // 2. Draw Main Sphere
            sphereParticles.forEach(p => {
                p.update(time, targetRotX, targetRotY + autoSpin)
            })

            sphereParticles.sort((a, b) => b.z - a.z)

            sphereParticles.forEach(p => {
                const zDepth = p.z + 1000
                if (zDepth <= 0) return

                const scale = focalLength / zDepth
                const projX = centerX + p.x * scale
                const projY = centerY + p.y * scale

                // Dynamic Color Gradient
                if (zDepth > 0) {
                    const normalizedX = Math.max(-1, Math.min(1, p.x / (baseRadius * 1.2)))
                    const t = (normalizedX + 1) / 2

                    const r = Math.floor(6 * (1 - t) + 217 * t) // Cyan -> Magenta
                    const g = Math.floor(182 * (1 - t) + 70 * t)
                    const b = Math.floor(212 * (1 - t) + 239 * t)

                    const alpha = Math.max(0.1, (1 - (p.z / 800)) * 0.5)

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`

                    const size = scale * 1.2

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

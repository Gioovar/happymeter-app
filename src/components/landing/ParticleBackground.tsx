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

        // 3D Config
        const cols = 50
        const rows = 50
        const separation = 40 // Distance between dots
        const particleCount = cols * rows

        // Particles Storage
        // We store x,y,z relative to center 0,0,0
        const particles: { x: number; z: number; originalX: number; originalZ: number }[] = []

        // Init Grid
        // Center the grid around (0,0,0)
        const startX = (cols * separation) / 2
        const startZ = (rows * separation) / 2

        for (let ix = 0; ix < cols; ix++) {
            for (let iz = 0; iz < rows; iz++) {
                const x = ix * separation - startX
                const z = iz * separation - startZ
                particles.push({
                    x,
                    z,
                    originalX: x,
                    originalZ: z
                })
            }
        }

        let time = 0

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            // Camera / Projection Settings
            const focalLength = 600
            const centerY = height / 2 + 100 // Move horizon down a bit
            const centerX = width / 2

            // Mouse Interaction: Rotate the entire grid slightly
            // Normalize mouse position -1 to 1
            const targetRotX = (mouseY / height - 0.5) * 0.5 // Tilt up/down
            const targetRotY = (mouseX / width - 0.5) * 0.5 // Pan left/right

            time += 0.02

            // Sort particles by Z depth so we draw distant ones first (Painter's Algorithm)
            // For simple dots it matters less, but good for depth opacity

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i]

                // 1. WAVE CALCULATION
                // Calculate Height (Y) based on Sine Waves
                // Add complexity: multiple waves
                const distFromCenter = Math.sqrt(p.originalX * p.originalX + p.originalZ * p.originalZ)

                // Main rolling wave
                let y = Math.sin((p.originalX * 0.01) + time) * 50
                // Cross wave
                y += Math.sin((p.originalZ * 0.02) + time) * 50
                // Ripple effect
                y += Math.sin(distFromCenter * 0.005 - time * 2) * 20

                // 2. 3D ROTATION
                // Rotate around Y (Pan)
                let rx = p.originalX * Math.cos(targetRotY) - p.originalZ * Math.sin(targetRotY)
                let rz = p.originalZ * Math.cos(targetRotY) + p.originalX * Math.sin(targetRotY)

                // Rotate around X (Tilt) - Apply to y and z
                let ry = y * Math.cos(targetRotX) - rz * Math.sin(targetRotX)
                rz = rz * Math.cos(targetRotX) + y * Math.sin(targetRotX)

                // Push grid into the distance so it's not in our face
                rz += 1000 // Z-offset

                // 3. PROJECTION (3D -> 2D)
                if (rz > 0) { // Only draw if in front of camera
                    const scale = focalLength / rz
                    const projX = centerX + rx * scale
                    const projY = centerY + ry * scale

                    // Style
                    // Alpha based on depth (fog effect)
                    const alpha = Math.max(0, 1 - (rz / 3000))
                    // Size based on depth
                    const size = Math.max(0.5, 3 * scale)

                    ctx.beginPath()
                    ctx.fillStyle = `rgba(139, 92, 246, ${alpha})` // Violet theme
                    // Use a mix of colors?
                    // Let's use Cyan/Violet gradient based on height
                    // if (y > 20) ctx.fillStyle = `rgba(6, 182, 212, ${alpha})` // Cyan peaks

                    ctx.arc(projX, projY, size, 0, Math.PI * 2)
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
                background: 'radial-gradient(circle at center, #020617 0%, #000 100%)'
            }}
        />
    )
}

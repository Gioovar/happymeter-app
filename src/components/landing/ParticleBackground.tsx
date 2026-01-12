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

        let mouseX = -1000
        let mouseY = -1000

        interface Particle {
            x: number
            y: number
            targetX: number
            targetY: number
            vx: number
            vy: number
            size: number
            color: string
        }

        let particles: Particle[] = []

        // Brand colors for the logo particles
        const colors = [
            'rgba(139, 92, 246, 0.9)', // Violet
            'rgba(217, 70, 239, 0.9)', // Fuchsia
            'rgba(6, 182, 212, 0.9)'   // Cyan
        ]

        const initParticles = (image: HTMLImageElement) => {
            particles = []

            // Draw image to a virtual canvas to read pixel data
            const virtualCanvas = document.createElement('canvas')
            const vCtx = virtualCanvas.getContext('2d')
            if (!vCtx) return

            // Responsive Scaling - DOUBLE SIZE
            // We want the logo to be DOMINANT
            const scale = Math.min(width, height) * 0.85
            // Aspect ratio of the image
            const aspectRatio = image.width / image.height

            const imgHeight = scale
            const imgWidth = scale * aspectRatio

            virtualCanvas.width = width
            virtualCanvas.height = height

            // Center image
            const offsetX = (width - imgWidth) / 2
            const offsetY = (height - imgHeight) / 2

            vCtx.drawImage(image, offsetX, offsetY, imgWidth, imgHeight)

            // Read pixel data
            // Optimization: Don't read every pixel. Skip based on density.
            const density = window.innerWidth < 768 ? 6 : 4 // Higher number = fewer particles
            const imageData = vCtx.getImageData(0, 0, width, height)
            const data = imageData.data

            for (let y = 0; y < height; y += density) {
                for (let x = 0; x < width; x += density) {
                    const index = (y * width + x) * 4
                    const alpha = data[index + 3]

                    if (alpha > 128) { // If pixel is visible
                        // This X,Y is a target
                        particles.push({
                            x: Math.random() * width, // Start random
                            y: Math.random() * height,
                            targetX: x,
                            targetY: y,
                            vx: 0,
                            vy: 0,
                            size: Math.random() * 2 + 1, // Bigger particles
                            color: colors[Math.floor(Math.random() * colors.length)]
                        })
                    }
                }
            }
        }

        // Helper to spawn fallback particles
        const spawnFallback = () => {
            console.log("Spawning fallback particles")
            for (let i = 0; i < 100; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    targetX: Math.random() * width,
                    targetY: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    color: colors[Math.floor(Math.random() * colors.length)]
                })
            }
        }

        // Load Image
        const image = new Image()
        image.src = '/logo-particles.png'

        image.onload = () => {
            console.log("Image loaded successfully", image.width, image.height)
            initParticles(image)
            console.log("Particles generated:", particles.length)

            if (particles.length === 0) {
                console.warn("No particles generated from image. Using fallback.")
                spawnFallback()
            }
            animate()
        }

        image.onerror = (e) => {
            console.error("Failed to load logo image", e)
            spawnFallback()
            animate()
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]

                // Physics
                // 1. Spring force to Target
                const dx = p.targetX - p.x
                const dy = p.targetY - p.y

                // Spring strength
                p.vx += dx * 0.05 // Stronger spring
                p.vy += dy * 0.05

                // 2. Mouse Repulsion (Disruption)
                const dmx = p.x - mouseX
                const dmy = p.y - mouseY
                const distMouse = Math.sqrt(dmx * dmx + dmy * dmy)
                // Much larger activation zone
                const mouseRadius = 300

                if (distMouse < mouseRadius) {
                    const force = (mouseRadius - distMouse) / mouseRadius
                    const angle = Math.atan2(dmy, dmx)
                    const pushStr = 20 // MUCH EXPLOSIVE

                    p.vx += Math.cos(angle) * force * pushStr
                    p.vy += Math.sin(angle) * force * pushStr
                }

                // Friction
                p.vx *= 0.85
                p.vy *= 0.85

                p.x += p.vx
                p.y += p.vy

                // Draw Particle
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.fill()
            }

            // Draw Connections (Look for neighbors)
            // Optimization for high particle count: only check a subset or purely generic grid
            // Since logo has structure, we can just check local neighbors in the array?
            // No, the array order is scanline. So neighbors in array are neighbors in Y usually.
            // Let's rely on standard distance check but be careful with performance.
            // Limit checks to max 5000 checks per frame? Random subset?

            // For logo, the shape is defined by the particles themselves, 
            // explicit lines might be too heavy visual clutter if density is high.
            // Let's add faint lines ONLY if mouse is close, to show 'activation' in that area.

            // Drawing lines only near mouse
            /*
            particles.forEach((p1, index) => {
                const dmx = p1.x - mouseX
                const dmy = p1.y - mouseY
                const distMouse = Math.sqrt(dmx * dmx + dmy * dmy)
                
                if (distMouse < 150) {
                     // Check neighbors
                     for (let j = index + 1; j < particles.length; j++) {
                         const p2 = particles[j]
                         // Optimization: Skip if far in array index? (Likely far in Y)
                         // Just simple distance check for now
                         const dx = p1.x - p2.x
                         const dy = p1.y - p2.y
                         if (Math.abs(dx) > 20 || Math.abs(dy) > 20) continue; // Fast reject

                         const dist = Math.sqrt(dx*dx + dy*dy)
                         if (dist < 20) {
                             ctx.beginPath()
                             ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)'
                             ctx.moveTo(p1.x, p1.y)
                             ctx.lineTo(p2.x, p2.y)
                             ctx.stroke()
                         }
                     }
                }
            })
            */

            requestAnimationFrame(animate)
        }

        const handleResize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
            // Re-init to rescale logo
            initParticles(image)
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
                background: 'radial-gradient(circle at center, #020617 0%, #000 100%)'
            }}
        />
    )
}

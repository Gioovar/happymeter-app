import React from 'react'

interface LaserBorderProps {
    color?: 'violet' | 'yellow' | 'blue' | 'green' | 'pink' | 'white'
    className?: string
}

export default function LaserBorder({ color = 'violet', className = '' }: LaserBorderProps) {
    const colors = {
        violet: '#8b5cf6',
        yellow: '#eab308',
        blue: '#3b82f6',
        green: '#22c55e',
        pink: '#ec4899',
        white: '#ffffff'
    }

    const hexColor = colors[color]

    return (
        <>
            {/* Spinning Laser Gradient */}
            <div
                className={`absolute inset-[-100%] animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${className}`}
                style={{
                    background: `conic-gradient(from 0deg, transparent 0deg 340deg, ${hexColor} 360deg)`
                }}
            />
            {/* Inner Mask to create the border look (covers the center) */}
            <div className="absolute inset-[1px] rounded-[inherit] z-0 bg-[#0a0a0a]" />
        </>
    )
}

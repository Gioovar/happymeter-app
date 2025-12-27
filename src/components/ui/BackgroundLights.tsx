import React from 'react'

export function BackgroundLights() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
            {/* Top Left - Cyan/Violet Glow */}
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px]" />

            {/* Top Right - Pink/Fuchsia Glow */}
            <div className="absolute top-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-fuchsia-600/20 blur-[120px]" />

            {/* Bottom Left - Blue/Cyan */}
            <div className="absolute bottom-[0%] left-[10%] w-[30%] h-[40%] rounded-full bg-cyan-600/10 blur-[100px]" />

            {/* Center - Subtle accent */}
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] rounded-full bg-violet-900/10 blur-[140px]" />

            {/* Grid Pattern Overlay (Optional, common in SaaS backgrounds) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        </div>
    )
}

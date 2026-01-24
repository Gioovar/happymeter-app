
'use client'

import { useState, useEffect } from 'react'
import { Download, FileImage, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreatorAssetsPage() {
    const [assets, setAssets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchAssets()
    }, [])

    const fetchAssets = async () => {
        try {
            const res = await fetch('/api/admin/assets') // Reusing the same endpoint for reading
            if (res.ok) {
                const data = await res.json()
                setAssets(data)
            }
        } catch (error) {
            console.error('Error fetching assets')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
            {/* Header */}


            <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold">Material Oficial</h1>
                    <p className="text-gray-400">
                        Descarga logos, banners y capturas de pantalla de alta calidad para usar en tus videos y contenido promocional.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {assets.map((asset) => (
                            <div key={asset.id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden group hover:border-violet-500/30 transition duration-300">
                                <div className="aspect-[4/3] bg-black/50 p-8 flex items-center justify-center relative">
                                    {asset.type === 'LOGO' || asset.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-contain drop-shadow-2xl" />
                                    ) : (
                                        <FileImage className="w-16 h-16 text-gray-700" />
                                    )}

                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <a
                                            href={asset.url}
                                            download
                                            target="_blank"
                                            className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-white/5 bg-[#151515]">
                                    <p className="font-medium truncate text-gray-200">{asset.name}</p>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                                        {asset.url.split('.').pop()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

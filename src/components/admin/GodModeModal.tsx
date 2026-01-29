'use client'

import { useState } from 'react'
import { X, Loader2, Zap } from 'lucide-react'
import { updateTenantSubscription } from '@/actions/admin'
import { useRouter } from 'next/navigation'

interface GodModeModalProps {
    isOpen: boolean
    onClose: () => void
    tenant: {
        userId: string
        businessName: string | null
        plan: string
        // We might not have these in the initial table data, so we might need to fetch them
        // OR we just assume defaults/pass what we have. 
        // For simplicity, let's accept what we have and maybe fetch current values or rely on defaults.
        // Ideally, the table should pass these. If not, we might need to fetch them before opening?
        // Let's assume we will update the table to pass these or fetch them inside the modal.
        // For now, let's accept optional initial values.
        maxBranches?: number
        extraSurveys?: number
    }
}

export default function GodModeModal({ isOpen, onClose, tenant }: GodModeModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        plan: tenant.plan || 'FREE',
        maxBranches: tenant.maxBranches || 1,
        extraSurveys: tenant.extraSurveys || 0
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await updateTenantSubscription(tenant.userId, {
                plan: formData.plan,
                maxBranches: Number(formData.maxBranches),
                extraSurveys: Number(formData.extraSurveys)
            })
            router.refresh()
            onClose()
        } catch (error) {
            alert('Failed to update subscription')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-orange-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                {/* God Mode Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500" />
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">God Mode Edit</h2>
                        <p className="text-xs text-orange-400 font-mono">SUPER ADMIN OVERRIDE</p>
                    </div>
                </div>

                <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-sm text-gray-400">Target User:</p>
                    <p className="font-bold text-white truncate">{tenant.businessName || tenant.userId}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Subscription Plan</label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none"
                        >
                            <option value="FREE">STARTER (Free)</option>
                            <option value="GROWTH">GROWTH</option>
                            <option value="POWER">POWER</option>
                            <option value="CHAIN">CHAIN</option>
                            <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Max Branches</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.maxBranches}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxBranches: parseInt(e.target.value) || 0 }))}
                                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Extra Surveys</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.extraSurveys}
                                onChange={(e) => setFormData(prev => ({ ...prev, extraSurveys: parseInt(e.target.value) || 0 }))}
                                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 fill-current" />
                                    APPLY OVERRIDE
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

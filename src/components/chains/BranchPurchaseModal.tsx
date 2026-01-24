'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, CreditCard, Building2, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { mockBuyBranch } from '@/actions/sales'

interface BranchPurchaseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    currentBranchCount: number
}

export function BranchPurchaseModal({ open, onOpenChange, onSuccess }: BranchPurchaseModalProps) {
    const [loading, setLoading] = useState(false)
    const [quantity, setQuantity] = useState(1)

    const PRICE = 3747
    const DISCOUNT_PRICE = 1499

    const handlePurchase = async () => {
        setLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            const res = await mockBuyBranch(quantity)
            if (res.success) {
                toast.success(`Sucursal desbloqueada correctamente.`)
                onSuccess()
                onOpenChange(false)
            } else {
                throw new Error(res.error)
            }
        } catch (error) {
            toast.error('Error procesando el pago.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#111111] border-[#333] text-white p-0 gap-0 sm:max-w-[450px] shadow-2xl overflow-hidden">
                {/* Header Clean */}
                <div className="p-6 border-b border-[#333] flex justify-between items-start">
                    <div>
                        <DialogTitle className="text-lg font-medium text-white">Límite de sucursales alcanzado</DialogTitle>
                        <p className="text-sm text-[#888] mt-1">
                            Tu plan actual no permite crear más sucursales.
                        </p>
                    </div>
                    <div className="bg-[#222] p-2 rounded-full">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Value Proposition - Clean List */}
                    <div className="space-y-4">
                        <div className="text-sm text-[#888] font-medium uppercase tracking-wider text-xs">Beneficios de expansión</div>
                        <ul className="space-y-3">
                            {[
                                'Gestión centralizada de múltiples sedes',
                                'Comparativas de rendimiento en tiempo real',
                                'Aislamiento de métricas y personal',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="w-4 h-4 text-white mt-0.5 shrink-0" />
                                    <span className="text-[13px] text-[#ccc] leading-tight">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pricing Section - Minimalist */}
                    <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#333]">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-[#888]">Cantidad</span>
                                <div className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-md px-1">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-6 h-6 flex items-center justify-center text-[#888] hover:text-white transition"
                                    >-</button>
                                    <span className="text-sm font-mono w-4 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-6 h-6 flex items-center justify-center text-[#888] hover:text-white transition"
                                    >+</button>
                                </div>
                            </div>
                            <Badge className="bg-white text-black hover:bg-gray-200 border-0 text-[10px] font-bold px-2 py-0.5 h-auto">
                                -60% OFF
                            </Badge>
                        </div>

                        <div className="flex items-baseline justify-between border-t border-[#333] pt-4">
                            <span className="text-sm text-[#888]">Total a pagar</span>
                            <div className="text-right">
                                <div className="text-xs text-[#666] line-through mb-0.5">
                                    ${(PRICE * quantity).toLocaleString()}
                                </div>
                                <div className="text-2xl font-semibold text-white tracking-tight">
                                    ${(DISCOUNT_PRICE * quantity).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[#1A1A1A] border-t border-[#333] flex flex-col gap-3">
                    <Button
                        className="w-full bg-white text-black hover:bg-gray-200 h-11 font-medium text-sm transition-colors"
                        onClick={handlePurchase}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Realizar Pago'}
                    </Button>
                    <p className="text-center text-[11px] text-[#666]">
                        Pago único • Acceso inmediato • Sin contratos forzosos
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

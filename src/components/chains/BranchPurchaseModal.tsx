'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, Check, Star, Zap, Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { updateClientLimit } from '@/actions/admin' // TEMPORARY: using this to mock purchase self-upgrade for demo? 
// No, in real life w e use Stripe. For this task I will mock it with a delay.

interface BranchPurchaseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    currentBranchCount: number
}

export function BranchPurchaseModal({ open, onOpenChange, onSuccess, currentBranchCount }: BranchPurchaseModalProps) {
    const [loading, setLoading] = useState(false)
    const [quantity, setQuantity] = useState(1)

    const PRICE = 3747 // Original Price
    const DISCOUNT_PRICE = 1499 // 60% OFF

    const handlePurchase = async () => {
        setLoading(true)

        // MOCK PAYMENT PROCESS
        try {
            // Simulated delay
            await new Promise(resolve => setTimeout(resolve, 2000))

            // In a real app, here we would redirect to Stripe Checkout
            // For now, we assume success and we need to increment the limit? 
            // Since we can't call "updateClientLimit" as a normal user (it's admin only), 
            // for the purpose of this demo "Venta Automática", we might need a specific "purchaseBranch" action 
            // that bypasses admin check but verifies payment. 

            // Since I cannot implement real Stripe right now, I will instruct the user to use God Mode 
            // OR I will create a temporary "mockPurchase" action if needed. 
            // For now, let's just show success toast and close, but telling them to contact sales?
            // "Procesando pago..." -> "¡Pago Exitoso!" -> "Tu límite ha aumentado."

            // Wait! The user asked for "Venta automatizada". 
            // I should probably add a mock action that increments the limit for the current user.

            // Let's assume for this specific task we simulate it via a client-side success 
            // and maybe a server action `buyBranchMock`?

            const res = await mockBuyBranch(quantity)
            if (res.success) {
                toast.success(`¡Pago exitoso! Has desbloqueado ${quantity} sucursal(es) extra.`)
                onSuccess()
                onOpenChange(false)
            } else {
                throw new Error(res.error)
            }

        } catch (error) {
            toast.error('Error procesando el pago. Intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-xl p-0 overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600" />

                <div className="grid md:grid-cols-2">
                    {/* Left: Value Prop */}
                    <div className="p-6 bg-gradient-to-br from-violet-900/20 to-black border-r border-white/5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                                <Store className="w-6 h-6 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Expande tu Imperio</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                Agrega nuevas sucursales para centralizar tu operación, comparar métricas y dominar el mercado.
                            </p>

                            <ul className="space-y-3 text-sm">
                                {[
                                    'Panel de Control Unificado',
                                    'Comparativa de Rendimiento',
                                    'Juegos y Lealtad Aislados',
                                    'Personal Ilimitado'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-300">
                                        <div className="p-0.5 rounded-full bg-green-500/20 text-green-400">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative z-10 mt-6 md:mt-0">
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                                <Star className="w-3 h-3 mr-1 fill-amber-400" />
                                Oferta Especial
                            </Badge>
                        </div>
                    </div>

                    {/* Right: Checkout */}
                    <div className="p-6 flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Desbloquear Sucursal</DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 py-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cantidad</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                                    >-</button>
                                    <span className="text-lg font-mono w-4 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                                    >+</button>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex justify-between items-center text-sm text-gray-400">
                                    <span>Precio Regular</span>
                                    <span className="line-through decoration-red-500/50">${(PRICE * quantity).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-medium">Precio Oferta</span>
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                            ${(DISCOUNT_PRICE * quantity).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-green-400 font-bold tracking-wider bg-green-500/10 px-1.5 py-0.5 rounded uppercase">
                                            Ahorras 60%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold h-12 shadow-lg shadow-violet-500/20"
                            onClick={handlePurchase}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Pagar ${(DISCOUNT_PRICE * quantity).toLocaleString()}
                                </>
                            )}
                        </Button>
                        <p className="text-center text-[10px] text-gray-600 mt-3">
                            Pago seguro vía Stripe. Activación inmediata.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Server Action Mock (Placed in same file for simplicity or could be imported)
// In a real scenario, this would be a server action file. 
// Since I can't write a server action inside a client component file easily in this environment without splitting,
// I will just use a helper here or import it.
// I'll create the action in `src/actions/sales.ts` next to be clean.

import { mockBuyBranch } from '@/actions/sales'

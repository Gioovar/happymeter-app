
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Percent, DollarSign, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Coupon {
    id: string
    code: string
    type: 'PERCENTAGE' | 'FIXED' | 'TRIAL'
    value: number
    maxUses: number | null
    usedCount: number
    expiresAt: string | null
    isActive: boolean
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    // Form State
    const [newCode, setNewCode] = useState('')
    const [newType, setNewType] = useState<'PERCENTAGE' | 'FIXED' | 'TRIAL'>('PERCENTAGE')
    const [newValue, setNewValue] = useState('')
    const [newMaxUses, setNewMaxUses] = useState('')
    const [newExpiresAt, setNewExpiresAt] = useState('')

    useEffect(() => {
        fetchCoupons()
    }, [])

    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/admin/coupons')
            if (res.ok) {
                const data = await res.json()
                setCoupons(data)
            }
        } catch (error) {
            console.error('Failed to fetch coupons', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)

        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: newCode,
                    type: newType,
                    value: newValue,
                    maxUses: newMaxUses || null,
                    expiresAt: newExpiresAt || null
                })
            })

            if (res.ok) {
                const coupon = await res.json()
                setCoupons([coupon, ...coupons])
                // Reset form
                setNewCode('')
                setNewValue('')
                setNewMaxUses('')
                setNewExpiresAt('')
            } else {
                alert('Error al crear cupón')
            }
        } catch (error) {
            console.error('Error creating coupon', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cupón?')) return

        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setCoupons(coupons.filter(c => c.id !== id))
            }
        } catch (error) {
            console.error('Error deleting coupon', error)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Tag className="w-8 h-8 text-violet-500" />
                            Gestión de Cupones
                        </h1>
                        <p className="text-gray-400 mt-2">Crea y administra códigos de descuento para tus usuarios.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5" /> Nuevo Cupón
                            </h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código</label>
                                    <input
                                        type="text"
                                        value={newCode}
                                        onChange={e => setNewCode(e.target.value.toUpperCase())}
                                        placeholder="EJ: VERANO2024"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:outline-none font-mono"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewType('PERCENTAGE')}
                                            className={`p-2 rounded-lg border text-xs font-bold transition ${newType === 'PERCENTAGE' ? 'bg-violet-500/20 border-violet-500 text-violet-400' : 'bg-white/5 border-transparent text-gray-400'}`}
                                        >
                                            %
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewType('FIXED')}
                                            className={`p-2 rounded-lg border text-xs font-bold transition ${newType === 'FIXED' ? 'bg-violet-500/20 border-violet-500 text-violet-400' : 'bg-white/5 border-transparent text-gray-400'}`}
                                        >
                                            $
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewType('TRIAL')}
                                            className={`p-2 rounded-lg border text-xs font-bold transition ${newType === 'TRIAL' ? 'bg-violet-500/20 border-violet-500 text-violet-400' : 'bg-white/5 border-transparent text-gray-400'}`}
                                        >
                                            Trial
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor</label>
                                    <input
                                        type="number"
                                        value={newValue}
                                        onChange={e => setNewValue(e.target.value)}
                                        placeholder={newType === 'PERCENTAGE' ? '20' : newType === 'FIXED' ? '10' : '30'}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Límite Usos</label>
                                        <input
                                            type="number"
                                            value={newMaxUses}
                                            onChange={e => setNewMaxUses(e.target.value)}
                                            placeholder="∞"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expira</label>
                                        <input
                                            type="date"
                                            value={newExpiresAt}
                                            onChange={e => setNewExpiresAt(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cupón'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Coupons List */}
                    <div className="lg:col-span-2 space-y-4">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-500">Cargando cupones...</div>
                        ) : coupons.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                                <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-300">No hay cupones activos</h3>
                                <p className="text-gray-500">Crea el primero usando el formulario.</p>
                            </div>
                        ) : (
                            coupons.map(coupon => (
                                <div key={coupon.id} className="group bg-white/5 border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 flex items-center justify-between transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                            {coupon.type === 'PERCENTAGE' && <Percent className="w-6 h-6 text-violet-400" />}
                                            {coupon.type === 'FIXED' && <DollarSign className="w-6 h-6 text-violet-400" />}
                                            {coupon.type === 'TRIAL' && <Clock className="w-6 h-6 text-violet-400" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold font-mono tracking-wider text-white">{coupon.code}</h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                                <span className="text-violet-300 font-medium">
                                                    {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` :
                                                        coupon.type === 'FIXED' ? `$${coupon.value} OFF` :
                                                            `${coupon.value} Días Gratis`}
                                                </span>
                                                <span>•</span>
                                                <span>{coupon.usedCount} / {coupon.maxUses || '∞'} usos</span>
                                                {coupon.expiresAt && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Expira: {format(new Date(coupon.expiresAt), 'dd MMM yyyy')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(coupon.id)}
                                        className="p-3 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition"
                                        title="Eliminar cupón"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

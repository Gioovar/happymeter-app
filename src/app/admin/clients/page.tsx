'use client'

import { useState, useEffect } from 'react'
import { getClients, updateClientLimit } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Shield, Zap, Edit2, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function GodModeClientsPage() {
    const [query, setQuery] = useState('')
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const data = await getClients(query)
            setUsers(data)
        } catch (error) {
            toast.error('Error cargando usuarios')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers()
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    return (
        <div className="p-8 space-y-8 bg-black/50 min-h-screen text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                        Modo Dios: Clientes
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Administración total de cuentas, límites y accesos.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-lg text-yellow-500">
                    <Shield className="w-5 h-5" />
                    <span className="font-mono text-sm font-bold">SUPER_ADMIN ACTIVE</span>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Input
                    placeholder="Buscar por nombre, email o ID..."
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-950/50 backdrop-blur-xl">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-gray-400">Cliente</TableHead>
                            <TableHead className="text-gray-400">Plan Actual</TableHead>
                            <TableHead className="text-gray-400 text-center">Sucursales</TableHead>
                            <TableHead className="text-gray-400 text-center">Límite</TableHead>
                            <TableHead className="text-gray-400">Fecha Registro</TableHead>
                            <TableHead className="text-gray-400 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Cargando datos del multiverso...
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <ClientRow key={user.userId} user={user} onUpdate={fetchUsers} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function ClientRow({ user, onUpdate }: { user: any, onUpdate: () => void }) {
    const [editing, setEditing] = useState(false)
    const [limit, setLimit] = useState(user.maxBranches || 1)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await updateClientLimit(user.userId, { maxBranches: limit })
            if (res.success) {
                toast.success('Límites actualizados')
                setEditing(false)
                onUpdate()
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error('Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    return (
        <TableRow className="border-white/5 hover:bg-white/5 transition-colors">
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium text-white">{user.businessName || 'Sin Nombre'}</span>
                    <span className="text-xs text-mono text-gray-500">{user.userId}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${user.plan === 'FREE' ? 'border-gray-600 text-gray-400' : 'border-violet-500 text-violet-400 bg-violet-500/10'}`}>
                        {user.plan}
                    </Badge>
                    {user.role === 'SUPER_ADMIN' && <Badge className="bg-yellow-500 text-black">GOD</Badge>}
                </div>
            </TableCell>
            <TableCell className="text-center font-mono text-gray-300">
                {user.branchCount || 0}
            </TableCell>
            <TableCell className="text-center">
                {editing ? (
                    <div className="flex items-center justify-center gap-2">
                        <Input
                            type="number"
                            className="w-16 h-8 text-center bg-black border-white/20"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value))}
                        />
                    </div>
                ) : (
                    <span className={`font-mono font-bold ${user.maxBranches > 1 ? 'text-green-400' : 'text-gray-500'}`}>
                        {user.maxBranches || 1}
                    </span>
                )}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
                {editing ? (
                    <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => setEditing(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                    </div>
                ) : (
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 bg-white/5 hover:bg-white/10 border border-white/10 text-xs"
                            onClick={() => setEditing(true)}
                        >
                            <Zap className="w-3 h-3 mr-2 text-violet-400" />
                            Editar Límites
                        </Button>
                        {/* More actions dialog could go here */}
                    </div>
                )}
            </TableCell>
        </TableRow>
    )
}

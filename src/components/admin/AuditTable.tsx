'use client'

import { Shield, Clock, User, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Log {
    id: string
    action: string
    details: any
    createdAt: Date
    adminId: string
    ipAddress: string | null
}

export default function AuditTable({ logs }: { logs: Log[] }) {
    return (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-3">Acción</th>
                            <th className="px-6 py-3">Detalles</th>
                            <th className="px-6 py-3">Admin</th>
                            <th className="px-6 py-3">IP</th>
                            <th className="px-6 py-3 text-right">Tiempo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-violet-500" />
                                        <span className="font-bold text-white max-w-[200px] truncate">
                                            {log.action}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 max-w-xs truncate" title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || ''}>
                                    {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : '-'}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {log.adminId.substring(0, 8)}...
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                                    {log.ipAddress || 'unknown'}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                    <div className="flex items-center justify-end gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: es })}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {logs.length === 0 && (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                    <AlertTriangle className="w-8 h-8 opacity-20 mb-2" />
                    No hay registros de auditoría recientes.
                </div>
            )}
        </div>
    )
}


'use client'

import { useState } from 'react'
import { Users, Star, Trophy, Award, Printer } from 'lucide-react'

interface StaffMember {
    name: string
    count: number
    average: string
}

interface StaffLeaderboardProps {
    staffRanking: StaffMember[]
}

export default function StaffLeaderboard({ staffRanking }: StaffLeaderboardProps) {
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

    const handlePrintDiploma = (staff: StaffMember) => {
        const printWindow = window.open('', '', 'width=800,height=600')
        if (!printWindow) return

        const diplomaContent = `
            <html>
                <head>
                    <title>Diploma - ${staff.name}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', sans-serif; text-align: center; padding: 50px; background: #f9f9f9; color: #333; }
                        .diploma { border: 10px solid #ddd; padding: 50px; background: #fff; max-width: 800px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative; }
                        h1 { font-size: 48px; color: #d4af37; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
                        h2 { font-size: 24px; color: #555; margin-bottom: 40px; font-weight: 300; }
                        .name { font-size: 64px; font-weight: bold; color: #111; margin: 20px 0; border-bottom: 2px solid #d4af37; display: inline-block; padding-bottom: 10px; }
                        .reason { font-size: 20px; color: #666; margin-top: 20px; line-height: 1.6; }
                        .footer { margin-top: 60px; display: flex; justify-content: space-between; padding: 0 50px; }
                        .sig-line { border-top: 1px solid #333; width: 200px; padding-top: 10px; font-size: 14px; text-transform: uppercase; }
                        .logo { font-size: 24px; font-weight: bold; position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); opacity: 0.3; }
                        @media print { body { background: none; } .diploma { box-shadow: none; border-color: #333; } }
                    </style>
                </head>
                <body>
                    <div class="diploma">
                        <h1>Reconocimiento</h1>
                        <h2>Al Empleado del Mes</h2>
                        
                        <div class="name">${staff.name}</div>
                        
                        <p class="reason">
                            Por su excepcional desempeño y compromiso con la excelencia en el servicio.<br>
                            Obteniendo una calificación promedio de <strong>${staff.average} estrellas</strong><br>
                            basada en ${staff.count} opiniones de clientes satisfechos.
                        </p>

                        <div class="footer">
                            <div class="sig-line">Gerencia</div>
                            <div class="sig-line">HappyMeter</div>
                        </div>

                        <div class="logo">🎖️ HappyMeter</div>
                    </div>
                    <script>
                        window.print();
                    </script>
                </body>
            </html>
        `

        printWindow.document.write(diplomaContent)
        printWindow.document.close()
    }

    if (!staffRanking || staffRanking.length === 0) {
        return (
            <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-300">Aún no hay ranking</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
                        Necesitamos más respuestas que mencionen a tu personal para generar el ranking.
                    </p>
                </div>
            </div>
        )
    }

    const topEmployee = staffRanking[0]

    return (
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Ranking de Personal
                </h3>
            </div>

            {/* Top Employee Spotlight */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                    <Award className="w-24 h-24 text-yellow-500" />
                </div>

                <div className="w-16 h-16 rounded-full bg-yellow-500 text-black flex items-center justify-center text-2xl font-bold shadow-lg shadow-yellow-500/20">
                    {topEmployee.name.charAt(0)}
                </div>

                <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                            Empleado del Mes
                        </span>
                    </div>
                    <h4 className="text-xl font-bold text-white mt-1">{topEmployee.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3.5 h-3.5 fill-yellow-400" /> {topEmployee.average}
                        </span>
                        <span>•</span>
                        <span>{topEmployee.count} menciones</span>
                    </div>
                </div>

                <button
                    onClick={() => handlePrintDiploma(topEmployee)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition mr-2"
                    title="Imprimir Diploma"
                >
                    <Printer className="w-5 h-5" />
                </button>
            </div>

            {/* List */}
            <div className="space-y-3 relative z-10">
                {staffRanking.slice(1).map((staff, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                                {idx + 2}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{staff.name}</p>
                                <p className="text-xs text-gray-500">{staff.count} menciones</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg">
                                <Star className="w-3 h-3 fill-yellow-500/50 text-yellow-500/50" />
                                <span className="text-sm font-bold text-gray-300">{staff.average}</span>
                            </div>
                            <button
                                onClick={() => handlePrintDiploma(staff)}
                                className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                                title="Imprimir reconocimiento"
                            >
                                <Printer className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total count footer */}
            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-gray-500">
                    Basado en comentarios que mencionan nombres específicos.
                </p>
            </div>
        </div>
    )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { toast } from "sonner"
import { validateVisitScan, logCustomerVisit, redeemReward } from "@/actions/loyalty"
import { Loader2, ScanLine, Tag, UtensilsCrossed, X, DollarSign, Camera, RefreshCcw } from "lucide-react"

interface StaffScannerProps {
    staffId: string
}

export function StaffScanner({ staffId }: StaffScannerProps) {
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [scannerError, setScannerError] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

    // Use consistent ref for the scanner instance
    const scannerRef = useRef<Html5Qrcode | null>(null)

    // Points Logic State
    const [showAmountModal, setShowAmountModal] = useState(false)
    const [pendingVisitToken, setPendingVisitToken] = useState<string | null>(null)
    const [customerName, setCustomerName] = useState("")
    const [spendAmount, setSpendAmount] = useState("")

    useEffect(() => {
        // Initialize scanner instance once
        const scanner = new Html5Qrcode("reader")
        scannerRef.current = scanner

        // Start scanning immediately
        startScanning(scanner, facingMode)

        // Cleanup on unmount
        return () => {
            if (scanner.isScanning) {
                scanner.stop().then(() => {
                    scanner.clear()
                }).catch(err => console.error("Failed to stop scanner", err))
            } else {
                scanner.clear()
            }
        }
    }, [])

    const startScanning = (scanner: Html5Qrcode, mode: "user" | "environment") => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        }

        scanner.start(
            { facingMode: mode },
            config,
            (decodedText) => {
                handleScan(decodedText)
            },
            (errorMessage) => {
                // ignore frames without QR
            }
        ).catch(err => {
            console.error("Error starting scanner:", err)
            setScannerError("No se pudo iniciar la cámara. Verifica los permisos.")
        })
    }

    const toggleCamera = async () => {
        const scanner = scannerRef.current
        if (!scanner) return

        try {
            if (scanner.isScanning) {
                await scanner.stop()
            }
            const newMode = facingMode === "environment" ? "user" : "environment"
            setFacingMode(newMode)
            startScanning(scanner, newMode)
        } catch (err) {
            console.error("Failed to toggle camera:", err)
            toast.error("Error al cambiar de cámara")
        }
    }

    const handleScan = async (data: string) => {
        // Prevent concurrent handling if multiple frames trigger before pause
        if (isProcessing) return
        setIsProcessing(true)

        // PAUSE SCANNER PHYSICALLY (Freeze frame)
        if (scannerRef.current?.isScanning) {
            try {
                scannerRef.current.pause(true)
            } catch (e) {
                console.log("Pause not supported or failed", e)
            }
        }

        let type = "UNKNOWN"
        let payload = data

        // Normalize payload logic
        if (data.startsWith("V:")) {
            type = "VISIT"
            payload = data.substring(2)
        } else if (data.startsWith("R:")) {
            type = "REDEEM"
            payload = data.substring(2)
        } else {
            // Heuristic detection
            if (data.includes("-") && data.length > 10) {
                // Long UUID-like with hyphens -> Visit Token
                type = 'VISIT'
            } else if (data.length <= 10) {
                // Short alphanumeric -> Redemption Code
                type = 'REDEEM'
            } else {
                // Fallback for odd formats
                type = 'VISIT'
            }
        }

        console.log(`Scan handling: Raw=${data}, Type=${type}, Payload=${payload}`)

        if (type === 'VISIT') {
            toast.loading("Verificando cliente...")

            // VALIDATE FIRST
            const validation = await validateVisitScan(payload)

            if (validation.success) {
                if (validation.programType === 'POINTS') {
                    // STOP and Ask for Amount
                    toast.dismiss()
                    setPendingVisitToken(payload)
                    setCustomerName(validation.customerName || "Cliente")
                    setShowAmountModal(true)
                    // Scanner stays paused until modal is closed
                } else {
                    // Log immediately for Visits based
                    await submitVisit(payload)
                }
            } else {
                toast.dismiss()
                toast.error(`Cliente no encontrado`, {
                    description: `Código: ${payload.substring(0, 15)}...`,
                    duration: 3000
                })
                // Resume after delay to allow reading error
                resumeScanner(2000)
            }

        } else if (type === 'REDEEM') {
            toast.loading("Verificando premio...")
            const res = await redeemReward(staffId, payload)
            if (res.success) {
                toast.dismiss()
                toast.success(`PREMIO ENTREGADO: ${res.rewardName}`, {
                    description: `Cliente: ${res.customerName}`,
                    duration: 5000,
                    icon: <Tag className="w-5 h-5 text-purple-500" />
                })
                resumeScanner(3000)
            } else {
                toast.dismiss()
                toast.error(res.error || "Código inválido o ya usado")
                resumeScanner(2000)
            }
        } else {
            // Unknown type
            toast.error("Formato QR no reconocido")
            resumeScanner(2000)
        }
    }

    const resumeScanner = (delayMs: number = 0) => {
        setTimeout(() => {
            setIsProcessing(false)
            if (scannerRef.current) {
                try {
                    scannerRef.current.resume()
                } catch (e) {
                    // If resume fails, it might not be paused or state issue. 
                    // Just ensure processing flag is off.
                    console.log("Resume callback warning", e)
                }
            }
        }, delayMs)
    }

    const submitVisit = async (token: string, amount: number = 0) => {
        toast.loading("Registrando visita...")
        const res = await logCustomerVisit(staffId, token, undefined, amount > 0 ? { spendAmount: amount } : undefined)

        toast.dismiss()
        if (res.success) {
            toast.success(`Visita registrada!\n${res.tierName ? `MEMBER ${res.tierName}` : ""}`, {
                description: amount > 0 ? `Puntos ganados: ${res.pointsEarned}` : `Total de visitas: ${res.newVisits}`,
                duration: 4000,
                icon: <UtensilsCrossed className="w-5 h-5 text-green-500" />
            })
            // Reset modal
            setShowAmountModal(false)
            setPendingVisitToken(null)
            setSpendAmount("")
            resumeScanner(3000)
        } else {
            toast.error(res.error || "Error al registrar")
            resumeScanner(2000)
        }
    }

    const handleConfirmAmount = () => {
        if (!pendingVisitToken) return
        submitVisit(pendingVisitToken, parseFloat(spendAmount) || 0)
    }


    return (
        <div className="w-full max-w-md mx-auto relative">
            <style jsx global>{`
                #reader__scan_region {
                    background: white !important;
                }
                #reader__dashboard_section_csr span, 
                #reader__dashboard_section_swaplink {
                    color: #1e293b !important; /* slate-800 */
                    font-weight: 500 !important;
                }
                #reader__dashboard_section_csr button {
                    color: #4f46e5 !important; /* indigo-600 */
                    border-color: #4f46e5 !important;
                    background: white !important;
                }
                #reader select {
                    color: #1e293b !important;
                    background: white !important;
                    border: 1px solid #e2e8f0 !important;
                }
            `}</style>
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4">
                <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
                        <ScanLine className="w-5 h-5 text-indigo-600" /> Escaner de Lealtad
                    </h2>
                    <p className="text-sm text-slate-500">Escanea el QR del cliente o su premio</p>
                </div>

                <div className="relative">
                    <div id="reader" className="w-full overflow-hidden rounded-lg min-h-[300px] bg-black"></div>

                    {/* Toggle Camera Button */}
                    <button
                        onClick={toggleCamera}
                        className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all shadow-lg active:scale-95 z-10"
                    >
                        <RefreshCcw className="w-6 h-6" />
                    </button>
                </div>

                {scannerError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                        {scannerError}
                    </div>
                )}

                {isProcessing && !showAmountModal && (
                    <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                    </div>
                )}
            </div>

            {/* AMOUNT INPUT MODAL */}
            {showAmountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Registrar Consumo</h3>
                                <p className="text-slate-500 text-sm">Cliente: {customerName}</p>
                            </div>
                            <button onClick={() => { setShowAmountModal(false); setPendingVisitToken(null); setIsProcessing(false); }} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Monto del Ticket</label>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-6 h-6 text-slate-400" />
                                    <input
                                        type="number"
                                        value={spendAmount}
                                        onChange={(e) => setSpendAmount(e.target.value)}
                                        placeholder="0.00"
                                        autoFocus
                                        className="bg-transparent text-3xl font-bold text-slate-900 w-full outline-none placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <button className="w-full py-3 bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-200 transition-colors">
                                <Camera className="w-4 h-4" />
                                <span className="font-medium">Adjuntar Foto del Ticket</span>
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowAmountModal(false); setPendingVisitToken(null); setIsProcessing(false); }}
                                className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmAmount}
                                disabled={!spendAmount}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

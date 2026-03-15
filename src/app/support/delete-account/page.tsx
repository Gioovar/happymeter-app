import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DeleteAccountPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-red-500/30 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 py-16 max-w-5xl relative z-10">
                <div className="mb-12">
                    <Button variant="ghost" asChild className="mb-8 -ml-4 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Link href="/support" className="flex items-center">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Soporte
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Eliminar mi Cuenta</h1>
                    </div>
                    <p className="text-lg text-gray-400 max-w-2xl mt-4">
                        En Happy valoramos tu privacidad. Puedes solicitar la eliminación permanente de tu cuenta y toda tu información asociada en cualquier momento a través de este formulario seguro.
                    </p>
                </div>

                <div className="space-y-8">
                    <Alert className="bg-red-500/5 text-red-200 border-red-500/20 backdrop-blur-md rounded-2xl p-6">
                        <ShieldAlert className="h-6 w-6 text-red-500 mt-1" />
                        <div className="ml-4">
                            <AlertTitle className="text-red-400 font-semibold text-lg mb-2">Acción Irreversible</AlertTitle>
                            <AlertDescription className="text-red-200/80 mt-2 text-base leading-relaxed">
                                Eliminar tu cuenta es un proceso permanente. Perderás el acceso a todas las aplicaciones ecosistema Happy, tus historiales de reservaciones, reportes de comisiones (RPS), puntos de lealtad, y la configuración de tu perfil.
                                <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <strong className="text-red-400">Nota importante:</strong> Si tienes saldos a favor o comisiones pendientes de cobro, asegúrate de retirarlos antes de iniciar este proceso.
                                </div>
                            </AlertDescription>
                        </div>
                    </Alert>

                    <div className="grid lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2 bg-[#121212] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
                            <h3 className="text-xl font-semibold text-white">¿Qué datos se eliminan?</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-300">Tu perfil público y privado.</span>
                                </li>
                                <li className="flex items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-300">Historial de acceso y uso en las aplicaciones móviles y portal web.</span>
                                </li>
                                <li className="flex items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-300">Enlaces compartidos de Promotores (RPS).</span>
                                </li>
                                <li className="flex items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-300">Contactos, notificaciones y preferencias.</span>
                                </li>
                            </ul>

                            <div className="mt-6 p-5 bg-orange-500/10 border border-orange-500/20 rounded-2xl backdrop-blur-sm">
                                <p className="text-sm text-orange-200/90 flex flex-col gap-2">
                                    <span className="flex items-center font-medium text-orange-400">
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Retención Legal
                                    </span>
                                    Ciertos datos transaccionales (como pagos o cobros pasados) pueden ser retenidos por obligaciones legales, regulatorias y propósitos contables hasta por 5 años.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-gradient-to-b from-[#18181b] to-[#0a0a0a] shadow-2xl border border-white/10 p-8 md:p-10 rounded-3xl relative overflow-hidden">
                            {/* Inner subtle glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

                            <h3 className="text-2xl font-bold mb-3 text-white">Solicitar Eliminación</h3>
                            <p className="text-base text-gray-400 mb-8 border-b border-white/10 pb-6">
                                El proceso de eliminación de cuenta y purga de datos tardará un máximo de <strong className="text-white">15 días hábiles</strong>. Recibirás un correo confirmando la baja definitiva.
                            </p>

                            <form className="space-y-6 relative z-10">
                                <div className="space-y-3">
                                    <Label htmlFor="deleteEmail" className="text-gray-300 font-medium ml-1">Correo registrado en Happy</Label>
                                    <Input
                                        id="deleteEmail"
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-red-500/50 h-12 rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="reason" className="text-gray-300 font-medium ml-1">Motivo (Opcional)</Label>
                                    <Input
                                        id="reason"
                                        placeholder="¿Por qué deseas eliminar tu cuenta?"
                                        className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-red-500/50 h-12 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-3 pb-4">
                                    <Label htmlFor="confirm" className="text-gray-300 font-medium ml-1">
                                        Para confirmar, escribe <span className="text-red-400 font-bold select-all">ELIMINAR MI CUENTA</span>
                                    </Label>
                                    <Input
                                        id="confirm"
                                        placeholder="ELIMINAR MI CUENTA"
                                        className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-red-500/50 h-12 rounded-xl font-mono text-center tracking-widest uppercase"
                                        required
                                        pattern="ELIMINAR MI CUENTA"
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full h-14 text-base font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-[0.98]"
                                >
                                    Enviar Solicitud de Eliminación
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

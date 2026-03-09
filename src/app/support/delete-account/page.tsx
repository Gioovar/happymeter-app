import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DeleteAccountPage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-6 -ml-4">
                    <Link href="/support" className="flex items-center text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Soporte
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold tracking-tight text-red-600 mb-4">Eliminar mi Cuenta</h1>
                <p className="text-lg text-muted-foreground">
                    En Happy valoramos tu privacidad. Puedes solicitar la eliminación permanente de tu cuenta y toda tu información asociada en cualquier momento.
                </p>
            </div>

            <div className="space-y-8">
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                    <ShieldAlert className="h-5 w-5 !text-red-700" />
                    <AlertTitle className="text-red-800 font-semibold text-lg">Acción Irreversible</AlertTitle>
                    <AlertDescription className="text-red-700/90 mt-2">
                        Eliminar tu cuenta es un proceso permanente. Perderás el acceso a todas las aplicaciones ecosistema Happy, tus historiales de reservaciones, reportes de comisiones (RPS), puntos de lealtad, y la configuración de tu perfil.
                        <br className="mb-2" />
                        <br />
                        <strong>Nota:</strong> Si tienes saldos a favor o comisiones pendientes de cobro, asegúrate de retirarlos antes de iniciar este proceso.
                    </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-muted/30 p-6 rounded-2xl border space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-3">¿Qué datos se eliminan?</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">Tu perfil público y privado.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">Historial de acceso y uso en las aplicaciones móviles y portal web.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">Enlaces compartidos de Promotores (RPS).</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">Contactos, notificaciones y preferencias de comunicación.</span>
                            </li>
                        </ul>

                        <div className="mt-6 p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800 flex items-start">
                                <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
                                Ciertos datos transaccionales (como pagos o cobros pasados) pueden ser retenidos por obligaciones legales, regulatorias y propósitos contables hasta por 5 años, como se estipula en nuestra Política de Privacidad.
                            </p>
                        </div>
                    </div>

                    <div className="bg-card shadow-sm border p-6 rounded-2xl">
                        <h3 className="text-xl font-semibold mb-2">Solicitar Eliminación</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            El proceso de eliminación de cuenta y purga de datos tardará un máximo de <strong>15 días hábiles</strong>. Recibirás un correo confirmando la baja definitiva.
                        </p>

                        <form className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="deleteEmail">Correo registrado en Happy</Label>
                                <Input
                                    id="deleteEmail"
                                    type="email"
                                    placeholder="El correo con el que inicias sesión"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Motivo (Opcional)</Label>
                                <Input
                                    id="reason"
                                    placeholder="¿Por qué deseas eliminar tu cuenta?"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm">Para confirmar, escribe "ELIMINAR MI CUENTA"</Label>
                                <Input
                                    id="confirm"
                                    placeholder="ELIMINAR MI CUENTA"
                                    required
                                    pattern="ELIMINAR MI CUENTA"
                                />
                            </div>

                            <Button type="submit" variant="destructive" className="w-full mt-4">
                                Enviar Solicitud de Eliminación
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

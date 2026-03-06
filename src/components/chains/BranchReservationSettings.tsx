"use client";

import { useState } from "react";
import { Copy, Link, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { updateBranchReservationSettings } from "@/actions/franchise";
import { Loader2 } from "lucide-react";

export function BranchReservationSettings({
    chainBranchId,
    currentType,
    currentExternalUrl,
    currentAddress
}: {
    chainBranchId: string;
    currentType: string | null;
    currentExternalUrl: string | null;
    currentAddress: string | null;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [reservationType, setReservationType] = useState<"INTERNAL" | "EXTERNAL">(
        (currentType as "INTERNAL" | "EXTERNAL") || "INTERNAL"
    );
    const [externalUrl, setExternalUrl] = useState(currentExternalUrl || "");
    const [address, setAddress] = useState(currentAddress || "");

    const handleSave = async () => {
        if (reservationType === "EXTERNAL" && !externalUrl) {
            toast.error("Debes ingresar el enlace externo.");
            return;
        }

        if (reservationType === "EXTERNAL" && !externalUrl.startsWith("http")) {
            toast.error("El enlace externo debe comenzar con http:// o https://");
            return;
        }

        setLoading(true);
        const res = await updateBranchReservationSettings(chainBranchId, {
            reservationType,
            externalReservationUrl: externalUrl,
            address
        });

        setLoading(false);
        if (res.success) {
            toast.success("Configuración de reservación guardada.");
            setOpen(false);
        } else {
            toast.error(res.error || "Hubo un error al guardar.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10" title="Configurar Reservaciones de esta Sucursal">
                    <Settings className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#111] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl">Configurar Reservación</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Ajusta cómo funciona el enlace de esta sucursal en el menú de Franquicia.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">

                    <div className="space-y-2">
                        <Label className="text-gray-300">Dirección Física Corta</Label>
                        <Input
                            placeholder="Ej. Av. Condesa 123, CDMX"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="bg-white/5 border-white/10 text-white focus-visible:ring-violet-500"
                        />
                        <p className="text-xs text-gray-500">Esto ayuda al cliente a elegir la sucursal correcta.</p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-gray-300">Sistema de Reservación</Label>
                        <RadioGroup
                            value={reservationType}
                            onValueChange={(val: any) => setReservationType(val)}
                            className="grid gap-3"
                        >
                            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${reservationType === 'INTERNAL' ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                <RadioGroupItem value="INTERNAL" id="internal" className="mt-1" />
                                <div>
                                    <div className="font-medium text-white">HappyMeter Reservas</div>
                                    <div className="text-xs text-gray-400">Usa nuestro sistema interno de mapas y calendarios.</div>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${reservationType === 'EXTERNAL' ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                <RadioGroupItem value="EXTERNAL" id="external" className="mt-1" />
                                <div>
                                    <div className="font-medium text-white">Enlace Externo</div>
                                    <div className="text-xs text-gray-400">Redirige al cliente a OpenTable, CoverManager, etc.</div>
                                </div>
                            </label>
                        </RadioGroup>
                    </div>

                    {reservationType === "EXTERNAL" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-gray-300">URL del Sistema Externo</Label>
                            <div className="relative">
                                <Link className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="https://www.opentable.com.mx/r/restaurante"
                                    value={externalUrl}
                                    onChange={(e) => setExternalUrl(e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10 text-white focus-visible:ring-violet-500"
                                />
                            </div>
                        </div>
                    )}

                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-white hover:bg-white/10 hover:text-white">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar Configuración
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

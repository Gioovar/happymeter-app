"use client";

import { useState } from "react";
import { updateFranchiseSettings } from "@/actions/franchise";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrCode, Link as LinkIcon, Download, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function FranchiseReservationCard({
    chain
}: {
    chain: {
        id: string;
        name: string;
        slug: string | null;
        franchiseReservationMode: boolean;
    }
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [modeEnabled, setModeEnabled] = useState(chain.franchiseReservationMode);
    const [slug, setSlug] = useState(chain.slug || "");
    const [copied, setCopied] = useState(false);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.happymeters.com';
    const franchiseUrl = `${baseUrl}/reservas/${slug}`;

    const handleToggle = async (checked: boolean) => {
        setModeEnabled(checked);
        setIsSaving(true);
        const res = await updateFranchiseSettings(chain.id, { franchiseReservationMode: checked });
        if (!res.success) {
            toast.error(res.error || "Error al actualizar la configuración");
            setModeEnabled(!checked);
        } else {
            toast.success(checked ? "Modo Franquicia Activado" : "Modo Franquicia Desactivado");
        }
        setIsSaving(false);
    };

    const handleSaveSlug = async () => {
        if (!slug.trim()) {
            toast.error("El enlace no puede estar vacío.");
            return;
        }

        setIsSaving(true);
        const res = await updateFranchiseSettings(chain.id, { slug: slug.trim().toLowerCase() });
        if (!res.success) {
            toast.error(res.error || "Error al guardar el enlace");
        } else {
            toast.success("Enlace de franquicia guardado");
        }
        setIsSaving(false);
    };

    const copyToClipboard = () => {
        if (!slug) return;
        navigator.clipboard.writeText(franchiseUrl);
        setCopied(true);
        toast.success("Enlace copiado al portapapeles");
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadQR = () => {
        const svg = document.getElementById("franchise-qr-code");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `QR-Reservas-${chain.name.replace(/\s+/g, '-')}.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <Card className="bg-[#111] border-white/10 relative overflow-hidden">
            {/* Background Glow */}
            {modeEnabled && (
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-violet-600/20 blur-3xl rounded-full pointer-events-none" />
            )}

            <CardHeader className="pb-4 border-b border-white/5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-violet-400" />
                            QR de Franquicia para Reservaciones
                        </CardTitle>
                        <CardDescription>
                            Permite a tus clientes elegir en qué sucursal reservar desde un solo enlace.
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="franchise-mode" className="text-sm font-medium text-gray-300">
                            {modeEnabled ? 'Activo' : 'Inactivo'}
                        </Label>
                        <Switch
                            id="franchise-mode"
                            checked={modeEnabled}
                            onCheckedChange={handleToggle}
                            disabled={isSaving}
                            className="data-[state=checked]:bg-violet-600"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

                {modeEnabled && (
                    <div className="grid md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
                        {/* URL configuration */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Enlace Único de Franquicia</Label>
                                <div className="flex gap-2">
                                    <div className="flex flex-1 items-center rounded-md border border-white/10 bg-white/5 focus-within:ring-2 focus-within:ring-violet-500 overflow-hidden">
                                        <span className="pl-3 pr-2 py-2 text-sm text-gray-500 select-none bg-black/20 border-r border-white/10 whitespace-nowrap hidden sm:inline-block">
                                            {baseUrl}/reservas/
                                        </span>
                                        <span className="pl-3 pr-2 py-2 text-sm text-gray-500 select-none bg-black/20 border-r border-white/10 whitespace-nowrap sm:hidden">
                                            /reservas/
                                        </span>
                                        <input
                                            value={slug}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if (val.includes('/reservas/')) {
                                                    val = val.split('/reservas/').pop() || '';
                                                }
                                                val = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                                                if (val.startsWith('-')) val = val.substring(1);
                                                setSlug(val);
                                            }}
                                            placeholder="mi-marca"
                                            className="flex-1 bg-transparent border-none text-white px-3 py-2 text-sm outline-none placeholder:text-gray-600 min-w-0 h-10"
                                        />
                                    </div>
                                    <Button onClick={handleSaveSlug} disabled={isSaving || !slug || slug === chain.slug} className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">Usa minúsculas y guiones (ej. la-santi)</p>
                            </div>

                            {chain.slug && (
                                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-3">
                                    <h4 className="text-sm font-semibold text-violet-300">Enlace Público Activo</h4>
                                    <div className="flex items-center gap-2 justify-between bg-black/40 p-2.5 rounded-lg border border-white/5 truncate">
                                        <span className="text-sm text-gray-300 truncate">{franchiseUrl}</span>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" onClick={copyToClipboard}>
                                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <LinkIcon className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <Button variant="link" className="px-0 h-auto text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1" onClick={() => window.open(franchiseUrl, '_blank')}>
                                        Abrir enlace en nueva pestaña
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* QR Display */}
                        {chain.slug ? (
                            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                <div className="p-4 bg-white rounded-xl mb-4 shadow-xl">
                                    <QRCodeSVG
                                        id="franchise-qr-code"
                                        value={franchiseUrl}
                                        size={160}
                                        level="H"
                                        includeMargin={true}
                                        fgColor="#000000"
                                        bgColor="#FFFFFF"
                                    />
                                </div>
                                <Button onClick={downloadQR} className="w-full max-w-[200px] bg-violet-600 hover:bg-violet-700 text-white rounded-full">
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar QR
                                </Button>
                                <p className="text-xs text-gray-500 text-center mt-3 max-w-[200px]">
                                    Incluye este QR en tu menú, flyers y redes sociales.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] text-center">
                                <QrCode className="w-12 h-12 text-gray-600 mb-3" />
                                <h4 className="text-gray-400 font-medium">QR no disponible</h4>
                                <p className="text-sm text-gray-500 max-w-[200px] mt-1">Configura y guarda el enlace de la franquicia para generar el código QR maestro.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

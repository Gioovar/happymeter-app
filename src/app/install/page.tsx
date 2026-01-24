import PWAInstallButton from "@/components/PWAInstallButton";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { ArrowLeft, Share, PlusSquare, MoreVertical, Download } from "lucide-react";

export default function InstallPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <BrandLogo className="scale-125" />
                    </div>
                    <h1 className="text-2xl font-bold">Instalar HappyMeter</h1>
                    <p className="text-gray-400">
                        HappyMeter funciona como una aplicación nativa. No necesitas Play Store ni App Store.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                    {/* Automatic Button (Android/Chrome Desktop) */}
                    <div className="space-y-4 text-center border-b border-white/10 pb-6">
                        <div className="flex justify-center">
                            <PWAInstallButton className="w-full justify-center !py-3 !text-base bg-violet-600 hover:bg-violet-700 !shadow-violet-600/20" />
                        </div>
                        <p className="text-xs text-gray-500">
                            * Si el botón no aparece, sigue las instrucciones manuales abajo.
                        </p>
                    </div>

                    {/* iOS Instructions */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <span className="text-xl"></span> iPhone / iPad (Safari)
                        </h3>
                        <ol className="space-y-3 text-sm text-gray-300 list-decimal list-outside pl-4">
                            <li>
                                Toca el botón <strong>Compartir</strong> <Share className="inline w-4 h-4 mx-1" /> en la barra inferior.
                            </li>
                            <li>
                                Busca y selecciona <strong>"Agregar a Inicio"</strong> <PlusSquare className="inline w-4 h-4 mx-1" />.
                            </li>
                            <li>
                                Dale a <strong>Agregar</strong> arriba a la derecha.
                            </li>
                        </ol>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Android Instructions */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <span className="text-xl">🤖</span> Android (Chrome)
                        </h3>
                        <ol className="space-y-3 text-sm text-gray-300 list-decimal list-outside pl-4">
                            <li>
                                Toca los <strong>3 puntos</strong> <MoreVertical className="inline w-4 h-4 mx-1" /> arriba a la derecha.
                            </li>
                            <li>
                                Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a la pantalla principal".
                            </li>
                        </ol>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Desktop Instructions */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <span className="text-xl">💻</span> Computadora (Mac / PC)
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-300 list-disc list-outside pl-4">
                            <li>
                                <strong>Chrome / Edge:</strong> Busca el icono de instalación <Download className="inline w-4 h-4 mx-1" /> en el lado derecho de la barra de direcciones.
                            </li>
                            <li>
                                <strong>Safari (Mac):</strong> Ve a <em>Archivo</em> {">"} <em>Agregar al Dock</em>.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300 flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Ir al Dashboard sin instalar
                    </Link>
                </div>
            </div>
        </div>
    );
}

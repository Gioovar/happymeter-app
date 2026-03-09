"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadDailyReservationsCSV } from "@/actions/hostess";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DownloadCSVButton({ branchId }: { branchId: string }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            const res = await downloadDailyReservationsCSV(branchId);

            if (res.success && res.csv) {
                // Create Blob and trigger download
                const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                const dateStr = format(new Date(), "dd-MM-yyyy");
                link.setAttribute("download", `reservaciones_${dateStr}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success("Descarga completada");
            } else {
                toast.error(res.error || "Error al descargar");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado al descargar.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/10 hover:bg-white/5 disabled:opacity-50 text-white rounded-xl text-sm transition-colors"
        >
            {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            ) : (
                <Download className="w-4 h-4 text-sky-400" />
            )}
            <span>Exportar CSV</span>
        </button>
    );
}

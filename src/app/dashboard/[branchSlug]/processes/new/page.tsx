
import { getDashboardContext } from "@/lib/auth-context"
import { redirect } from "next/navigation"
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProcessFlowForm } from "@/components/processes/ProcessFlowForm"

export default async function NewProcessFlowPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug);
    if (!context || !context.userId) return redirect('/dashboard');

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href={`/dashboard/${params.branchSlug}/processes`} className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Procesos
                </Link>
                <h1 className="text-3xl font-bold text-white tracking-tight">Crear Nuevo Flujo</h1>
                <p className="text-gray-400 mt-2">Define una nueva zona operativa y sus tareas asociadas.</p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <ProcessFlowForm branchId={context.userId} branchSlug={params.branchSlug} />
            </div>
        </div>
    )
}

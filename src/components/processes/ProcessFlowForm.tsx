
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, GripVertical, Clock, CheckCircle2, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { createProcessZoneWithTasks } from "@/actions/processes-mutations"

const taskSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    description: z.string().optional(),
    limitTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)").optional().or(z.literal("")),
    evidenceType: z.enum(["PHOTO", "VIDEO", "QR", "GPS"]),
})

const formSchema = z.object({
    name: z.string().min(1, "El nombre de la zona es requerido"),
    description: z.string().optional(),
    tasks: z.array(taskSchema).min(1, "Debes agregar al menos una tarea"),
})

interface ProcessFlowFormProps {
    branchId: string
    branchSlug: string
    initialData?: any // Typed properly
    onSuccess?: () => void
}

import { updateProcessZone } from "@/actions/processes-mutations"

export function ProcessFlowForm({ branchId, branchSlug, initialData, onSuccess }: ProcessFlowFormProps) {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            tasks: initialData?.tasks?.map((t: any) => ({
                title: t.title,
                description: t.description || "",
                limitTime: t.limitTime || "",
                evidenceType: t.evidenceType
            })) || [{ title: "", description: "", limitTime: "", evidenceType: "PHOTO" }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "tasks"
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setSubmitting(true)
        try {
            // Clean up empty strings for optional fields
            const cleanTasks = values.tasks.map(t => ({
                ...t,
                limitTime: t.limitTime === "" ? undefined : t.limitTime,
                description: t.description === "" ? undefined : t.description
            }))

            if (initialData) {
                // UPDATE
                await updateProcessZone(initialData.id, {
                    name: values.name,
                    description: values.description,
                    assignedStaffId: initialData.assignedStaffId,
                    tasks: cleanTasks
                })
                toast.success("Flujo actualizado correctamente")
            } else {
                // CREATE
                await createProcessZoneWithTasks({
                    name: values.name,
                    description: values.description,
                    assignedStaffId: undefined,
                    tasks: cleanTasks
                })
                toast.success("Flujo creado exitosamente")
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push(`/dashboard/${branchSlug}/processes`)
            }
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Error al guardar el flujo")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Nombre de la Zona / Lista</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. Aperturas Barra, Limpieza Baños..." {...field} className="bg-white/5 border-white/10 text-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Descripción (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Detalles generales de este flujo..." {...field} className="bg-white/5 border-white/10 text-white min-h-[80px]" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Tareas ({fields.length})</h3>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => append({ title: "", description: "", limitTime: "", evidenceType: "PHOTO" })}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/10"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Tarea
                        </Button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="bg-[#1a1a1a] border-white/5">
                                <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
                                    <div className="bg-white/5 p-2 rounded text-gray-500 cursor-grab">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name={`tasks.${index}.title`}
                                            render={({ field }) => (
                                                <FormItem className="mb-0">
                                                    <FormControl>
                                                        <Input placeholder={`Tarea ${index + 1}`} {...field} className="bg-transparent border-0 text-white font-medium focus-visible:ring-0 placeholder:text-gray-600 px-0" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        className="text-gray-500 hover:text-red-400 hover:bg-white/5"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`tasks.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-xs text-gray-400">Instrucciones</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Descripción breve..." {...field} className="bg-white/5 border-white/10 text-white text-sm h-8" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`tasks.${index}.limitTime`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-gray-400">Hora Límite (Opcional)</FormLabel>
                                                <div className="relative">
                                                    <Clock className="absolute left-2 top-2 w-3 h-3 text-gray-500" />
                                                    <FormControl>
                                                        <Input placeholder="14:00" {...field} className="bg-white/5 border-white/10 text-white text-sm h-8 pl-7" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`tasks.${index}.evidenceType`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-gray-400">Tipo de Evidencia</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                                        <SelectItem value="PHOTO">📸 Foto</SelectItem>
                                                        <SelectItem value="VIDEO">🎥 Video</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-white/5">
                    <Button type="button" variant="ghost" className="text-gray-400 hover:text-white" onClick={onSuccess || (() => router.back())}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {initialData ? "Actualizar Flujo" : "Guardar Flujo"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

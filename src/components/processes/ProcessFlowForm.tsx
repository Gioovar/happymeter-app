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
import { Trash2, Plus, GripVertical, Clock, CheckCircle2, Loader2, Save, Camera, Video } from "lucide-react"
import { toast } from "sonner"
import { createProcessZoneWithTasks } from "@/actions/processes-mutations"

const taskSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    description: z.string().optional(),
    limitTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)").optional().or(z.literal("")),
    evidenceType: z.enum(["PHOTO", "VIDEO", "BOTH"]), // Aligned with Prisma
    days: z.array(z.string()).default([]),
})

const formSchema = z.object({
    name: z.string().min(1, "El nombre de la zona es requerido"),
    description: z.string().optional(),
    tasks: z.array(taskSchema).min(1, "Debes agregar al menos una tarea"),
})

// Schema for metadata-only editing (tasks are ignored)
const metadataSchema = z.object({
    name: z.string().min(1, "El nombre de la zona es requerido"),
    description: z.string().optional(),
})

interface ProcessFlowFormProps {
    branchId: string
    branchSlug: string
    initialData?: any // Typed properly
    onSuccess?: () => void
    onlyMetadata?: boolean // New prop to hide tasks
}

import { updateProcessZoneWithTasks } from "@/actions/processes-mutations"

export function ProcessFlowForm({ branchId, branchSlug, initialData, onSuccess, onlyMetadata = false }: ProcessFlowFormProps) {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)

    // Day options constant
    const dayOptions = [
        { id: "Mon", label: "L" },
        { id: "Tue", label: "M" },
        { id: "Wed", label: "X" },
        { id: "Thu", label: "J" },
        { id: "Fri", label: "V" },
        { id: "Sat", label: "S" },
        { id: "Sun", label: "D" },
    ]

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(onlyMetadata ? metadataSchema : formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            tasks: initialData?.tasks?.map((t: any) => ({
                title: t.title,
                description: t.description || "",
                limitTime: t.limitTime || "",
                evidenceType: t.evidenceType,
                days: t.days || []
            })) || [{ title: "", description: "", limitTime: "", evidenceType: "PHOTO", days: [] }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "tasks"
    })

    async function onSubmit(values: any) { // Use any to support both schemas
        setSubmitting(true)
        try {
            // If onlyEditing meatadata, we send empty tasks to avoid touching them
            // The server action 'updateProcessZoneWithTasks' only acts on tasks present in the array.
            // If we send [], it won't delete/update/create any task, effectively leaving them as is.

            const cleanTasks = onlyMetadata ? [] : values.tasks.map((t: any) => ({
                ...t,
                limitTime: t.limitTime === "" ? undefined : t.limitTime,
                description: t.description === "" ? undefined : t.description
            }))

            if (initialData) {
                // UPDATE
                await updateProcessZoneWithTasks({
                    zoneId: initialData.id,
                    name: values.name,
                    description: values.description,
                    assignedStaffId: initialData.assignedStaffId,
                    tasks: cleanTasks
                })
                toast.success("Zona actualizada correctamente")
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

    const onErrors = (errors: any) => {
        console.error("Form Errors:", errors)
        const firstError = Object.values(errors)[0] as any
        toast.error(firstError?.message || "Por favor revisa los campos requeridos")
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onErrors)} className="space-y-8">
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

                {!onlyMetadata && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Tareas ({fields.length})</h3>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => append({ title: "", description: "", limitTime: "", evidenceType: "PHOTO", days: [] })}
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
                                                            <SelectItem value="PHOTO">
                                                                <div className="flex items-center gap-2">
                                                                    <Camera className="w-3 h-3 text-purple-400" /> Foto
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="VIDEO">
                                                                <div className="flex items-center gap-2">
                                                                    <Video className="w-3 h-3 text-blue-400" /> Video
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="BOTH">
                                                                <div className="flex items-center gap-2">
                                                                    <Camera className="w-3 h-3 text-purple-400" />
                                                                    <span className="text-gray-500">+</span>
                                                                    <Video className="w-3 h-3 text-blue-400" />
                                                                    <span className="ml-1">Ambas</span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />

                                        {/* Days Selection */}
                                        <FormField
                                            control={form.control}
                                            name={`tasks.${index}.days`}
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel className="text-xs text-gray-400">Días Activos</FormLabel>
                                                    <div className="flex flex-wrap gap-2">
                                                        {dayOptions.map((day) => {
                                                            const isSelected = field.value?.includes(day.id)
                                                            return (
                                                                <button
                                                                    key={day.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = field.value || []
                                                                        const updated = current.includes(day.id)
                                                                            ? current.filter((d: string) => d !== day.id)
                                                                            : [...current, day.id]
                                                                        field.onChange(updated)
                                                                    }}
                                                                    className={`
                                                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border
                                                                    ${isSelected
                                                                            ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                                                                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                                                        }
                                                                `}
                                                                >
                                                                    {day.label}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                    <FormDescription className="text-[10px] text-gray-500">
                                                        {field.value?.length === 0 ? "Todos los días (Por defecto)" : `${field.value?.length} días seleccionados`}
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

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

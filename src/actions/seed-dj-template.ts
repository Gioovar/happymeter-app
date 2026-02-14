'use server';

import { prisma } from '@/lib/prisma';

export async function seedDJTemplate() {
    console.log("Seeding DJ Template...");

    const templateName = "Plantilla DJ - Eventos y Fin de Semana";

    // Check if it already exists to avoid duplicates
    const existing = await prisma.processTemplate.findFirst({
        where: { name: templateName }
    });

    if (existing) {
        return { success: false, message: "La plantilla de DJ ya existe." };
    }

    const template = await prisma.processTemplate.create({
        data: {
            name: templateName,
            description: "Checklist operativo para DJ: Montaje, Pruebas de Audio/Iluminación, y Cierre. Activo Jueves, Viernes y Sábados.",
            category: "Entretenimiento",
            tasks: {
                create: [
                    // Before Event - 7:00 PM Limit - Thu, Fri, Sat
                    {
                        title: "Antes del Evento - Limpieza Profunda de Cabina",
                        description: "Limpiar mesas, muebles, estructuras y equipos periféricos.",
                        defaultLimitTime: "19:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Antes del Evento - Retirar Desechos",
                        description: "Retirar vasos, latas y restos de alimentos de la cabina.",
                        defaultLimitTime: "19:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Antes del Evento - Ruta y Sujeción de Cables",
                        description: "Cables fijos con sujetadores/cinta. Evitar desorden en piso.",
                        defaultLimitTime: "19:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Antes del Evento - Verificación de Conexiones",
                        description: "Confirmar conexiones seguras, sin cables sueltos.",
                        defaultLimitTime: "19:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Antes del Evento - Prueba de Iluminación",
                        description: "Encender y probar lámparas, cabezas móviles, LED, estrobos.",
                        defaultLimitTime: "19:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Antes del Evento - Alineación de Iluminación",
                        description: "Alinear equipos según diseño del evento.",
                        defaultLimitTime: "19:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Antes del Evento - Corrección Fallas Iluminación",
                        description: "Reportar y corregir desperfectos antes del inicio.",
                        defaultLimitTime: "19:00",
                        evidenceType: "PHOTO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Antes del Evento - Verificación de Bocinas",
                        description: "Confirmar sonido claro, fuerte y sin interferencias.",
                        defaultLimitTime: "19:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Antes del Evento - Garantía Funcionamiento Audio",
                        description: "Corregir cualquier desperfecto de audio antes del servicio.",
                        defaultLimitTime: "19:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },

                    // After Event - 02:00 AM Limit - Thu, Fri, Sat
                    {
                        title: "Después del Evento - Apagado y Desconexión",
                        description: "Apagar audio, luces, consolas, micrófonos. Desconectar si aplica.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Después del Evento - Limpieza Superficies",
                        description: "Limpiar equipos con paño seco/microfibra (sin líquidos dañinos).",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Después del Evento - Retiro Residuos",
                        description: "Retirar toda la basura y dejar cabina limpia.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    },
                    {
                        title: "Después del Evento - Verificación Final",
                        description: "Cabina ordenada, limpia y equipo resguardado.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO",
                        days: ["Thu", "Fri", "Sat"]
                    }
                ]
            }
        }
    });

    return { success: true, message: "Plantilla de DJ creada correctamente.", templateId: template.id };
}

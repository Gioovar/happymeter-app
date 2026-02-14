'use server';

import { prisma } from '@/lib/prisma';

export async function seedManagerTemplate() {
    console.log("Seeding Manager Template...");

    const templateName = "Plantilla Gerente - Supervisión General";

    // Check if it already exists to avoid duplicates
    const existing = await prisma.processTemplate.findFirst({
        where: { name: templateName }
    });

    if (existing) {
        return { success: false, message: "La plantilla de Gerente ya existe." };
    }

    const template = await prisma.processTemplate.create({
        data: {
            name: templateName,
            description: "Checklist de supervisión gerencial: Apertura, Medio Turno y Cierre de todas las áreas (Salón, Cocina, Barra, Caja).",
            category: "Gerencia",
            tasks: {
                create: [
                    // Opening (Apertura) - 2:00 PM
                    {
                        title: "Apertura - Llegada Puntual",
                        description: "Llegar a tiempo según horario. Sin retardos.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Revisión de Uniforme",
                        description: "Uniforme completo, limpio y buena presentación personal.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Certificación Salón",
                        description: "Verificar limpieza, montaje y ambientación del salón.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Certificación Cocina",
                        description: "Verificar equipos, limpieza, mise en place y personal listo.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Certificación Barra",
                        description: "Verificar limpieza, stock, equipos y preparación de barra.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Certificación Caja",
                        description: "Verificar sistema, fondo, insumos y cajero listo.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Reporte Hora Apertura",
                        description: "Reportar hora exacta de apertura con evidencia visual del local.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },

                    // Mid-Shift
                    {
                        title: "Mitad de Turno - Certificación Salón",
                        description: "Verificar mantenimiento de limpieza y orden durante servicio.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Certificación Cocina",
                        description: "Verificar orden, limpieza y flujo de trabajo en cocina.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Certificación Barra",
                        description: "Verificar limpieza y reabastecimiento en barra.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Certificación Caja",
                        description: "Verificar orden y funcionamiento en caja.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },

                    // Closing (Cierre) - 02:00 AM
                    {
                        title: "Cierre - Certificación Salón",
                        description: "Salón limpio a fondo, sillas sobre mesas (si aplica), sin basura.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Certificación Cocina",
                        description: "Cocina impecable, equipos apagados, insumos guardados.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Certificación Barra",
                        description: "Barra limpia, sin insumos expuestos, equipos apagados.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Certificación Caja",
                        description: "Caja cerrada, corte realizado, equipos apagados.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Certificación DJ",
                        description: "Cabina limpia, equipos apagados, cables ordenados.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Reporte Hora Cierre",
                        description: "Reportar hora exacta de cierre con local totalmente recogido.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    }
                ]
            }
        }
    });

    return { success: true, message: "Plantilla de Gerente creada correctamente.", templateId: template.id };
}

'use server';

import { prisma } from '@/lib/prisma';

export async function seedKitchenTemplate() {
    console.log("Seeding Kitchen Template...");

    const templateName = "Plantilla de Cocina - Operación Completa";

    // Check if it already exists to avoid duplicates
    const existing = await prisma.processTemplate.findFirst({
        where: { name: templateName }
    });

    if (existing) {
        return { success: false, message: "La plantilla ya existe." };
    }

    const template = await prisma.processTemplate.create({
        data: {
            name: templateName,
            description: "Checklist integral para la operación diaria de cocina: Apertura, Mitad de Turno y Cierre. Incluye limpieza, producción y mantenimiento.",
            category: "Cocina",
            tasks: {
                create: [
                    // Opening (Apertura) - 2:00 PM Limit
                    {
                        title: "Apertura - Producción Completa y Preparación",
                        description: "Preparar ingredientes (picar, cortar, pelar), precocer, elaborar salsas y bases. Verificar mise en place completo. Uso obligatorio de cofia.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Mantenimiento y Cambio de Aceite",
                        description: "Limpieza profunda o cambio de aceite. Verificar nivel, temperatura y estado (sin residuos). Tener coladores listos.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Bandejas Limpias y Disponibles",
                        description: "Asegurar que todas las bandejas estén limpias, secas y en su lugar.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Verificación de Refrigeradores",
                        description: "Comprobar temperatura adecuada de todos los refrigeradores.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Producción Refrigerada",
                        description: "Confirmar que toda la producción esté almacenada en refrigeración y a temperatura correcta.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Empaquetado Correcto",
                        description: "Asegurar productos bien empaquetados, sellados y rotulados para evitar contaminación.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Revisión de Porcionado",
                        description: "Verificar porcionado exacto según estándar.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Orden y Rotación (FIFO)",
                        description: "Organizar productos por PEPS (Primeras Entradas, Primeras Salidas).",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Limpieza de Parrillas y Planchas",
                        description: "Verificar encendido, temperatura y limpieza de rejillas y utensilios.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Limpieza de Salseras y Loza",
                        description: "Salseras, mamilas y platos 100% limpios y secos.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Limpieza Profunda de Cocina",
                        description: "Desinfectar superficies, mesas, campanas y eliminar residuos/grasa.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Revisión de Gas",
                        description: "Verificar nivel de tanque, presión y ausencia de fugas.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },

                    // Mid-Shift (Mitad de Turno) - 20:00 (8 PM) Limit
                    {
                        title: "Mitad de Turno - Limpieza de Superficies",
                        description: "Lavar y desinfectar mesas de trabajo durante el turno.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Limpieza Equipos Cocción",
                        description: "Limpieza rápida de parrillas, planchas y freidoras (remover exceso de grasa/restos).",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Lavado Utensilios",
                        description: "Lavar y acomodar utensilios y equipos menores acumulados.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Limpieza Pisos",
                        description: "Barrer y trapear con desengrasante para evitar accidentes.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Gestión Basura",
                        description: "Vaciar botes, cambiar bolsas y limpiar área de basura.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Verificación General",
                        description: "Revisión final para continuar servicio sin pendientes visibles.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },

                    // Closing (Cierre) - 02:00 AM Limit
                    {
                        title: "Cierre - Limpieza Total Superficies",
                        description: "Lavar y desinfectar a fondo todas las mesas y áreas de trabajo.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Limpieza Profunda Equipos",
                        description: "Limpieza final de parrillas, planchas, freidoras. Sin grasa acumulada.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Lavado Total Utensilios",
                        description: "Todos los utensilios lavados, secos y guardados en su lugar.",
                        defaultLimitTime: "02:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Cierre - Limpieza Profunda Pisos",
                        description: "Tallado, barrido y trapeado profundo con desengrasante.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Basura y Orden Final",
                        description: "Retirar toda la basura, limpiar botes. Cocina totalmente ordenada.",
                        defaultLimitTime: "02:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Cierre - Revisión Campanas y Filtros",
                        description: "Verificar y limpiar filtros de campana si hay grasa acumulada.",
                        defaultLimitTime: "02:00",
                        evidenceType: "PHOTO"
                    }
                ]
            }
        }
    });

    return { success: true, message: "Plantilla creada correctamente.", templateId: template.id };
}

'use server';

import { prisma } from '@/lib/prisma';

export async function seedBarTemplate() {
    console.log("Seeding Bar Template...");

    const templateName = "Plantilla de Barra - Operación Completa";

    // Check if it already exists to avoid duplicates
    const existing = await prisma.processTemplate.findFirst({
        where: { name: templateName }
    });

    if (existing) {
        return { success: false, message: "La plantilla de Barra ya existe." };
    }

    const template = await prisma.processTemplate.create({
        data: {
            name: templateName,
            description: "Checklist integral para la operación diaria de Barra: Apertura, Mitad de Turno y Cierre. Incluye limpieza, preparación de mezclas, stock y mantenimiento.",
            category: "Barra",
            tasks: {
                create: [
                    // Opening (Apertura) - 2:00 PM Limit
                    {
                        title: "Apertura - Limpieza de Barra y Contra Barra",
                        description: "Limpiar superficies, repisas y paredes. Eliminar residuos y manchas. Área seca y ordenada.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Limpieza de Licuadoras",
                        description: "Lavar a fondo, desmontar piezas (si aplica), eliminar restos de fruta/azúcar.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Limpieza de Piso en Área de Barra",
                        description: "Barrer y trapear con desinfectante. Sin residuos ni líquidos.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Limpieza y Organización de Utensilios",
                        description: "Lavar, desinfectar y acomodar todos los utensilios. Ninguno sucio o fuera de lugar.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Limpieza Interna del Refrigerador",
                        description: "Retirar lo del turno pasado, limpieza general interior.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Revisión de Fechas y Estado",
                        description: "Verificar productos y retirar vencidos o en mal estado.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Limpieza Completa de Cristalería",
                        description: "Lavar con agua caliente y detergente. Secar, sin manchas ni olores.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Revisión de Integridad de Cristalería",
                        description: "Inspeccionar y descartar cristalería quebrada o astillada.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Organización de Cristalería",
                        description: "Ordenar por tipo, tamaño y uso para agilizar servicio.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Preparación de Mezclas",
                        description: "Elaborar mezclas sin grumos, en recipientes limpios y etiquetados.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Alistamiento de Escarchados",
                        description: "Sal, chile, azúcar listos en recipientes sin humedad excesiva.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Control de Calidad de Gomitas",
                        description: "Frescas, sin mezclar tipos, en envases limpios.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Preparación de Garnituras",
                        description: "Cortar y presentar cítricos/frutas. Refrigerar para conservar frescura.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Stock de Licores y Cerveza",
                        description: "Revisar stock fuera de barra (bodega/refri). Acomodar por tipo/marca con etiquetas visibles.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Acomodo de Cartones Vacíos",
                        description: "Recoger y apilar cartones vacíos ordenadamente, lejos de servicio.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },

                    // Mid-Shift (Mitad de Turno) - 20:00 (8 PM) Limit
                    {
                        title: "Mitad de Turno - Limpieza de Superficies",
                        description: "Limpiar barras frontales y traseras. Libres de residuos o manchas.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Limpieza Cristalería y Utensilios",
                        description: "Lavar, secar y acomodar cristalería y herramientas acumuladas.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Limpieza de Tarjas",
                        description: "Retirar restos de alimento/suciedad de tarjas. Desinfectar.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Limpieza de Pisos",
                        description: "Barrer y trapear alrededor de la barra. Sin superficies resbalosas.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Reposición de Insumos",
                        description: "Rellenar servilleteros, popotes, agitadores.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Orden y Presentación",
                        description: "Barra seca, limpia, organizada y presentable.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },

                    // Closing (Cierre) - 02:00 AM Limit (or 03:30 AM per some cells, adhering to 02:00 description/consistency)
                    {
                        title: "Cierre - Limpieza Total Superficies",
                        description: "Limpieza y desinfección profunda de barras (frontal/trasera).",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Lavado Total Cristalería y Utensilios",
                        description: "Todo lavado, seco y guardado en su lugar para mañana.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Limpieza de Tarjas",
                        description: "Tarjas higiénicas y desinfectadas.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Limpieza Profunda Pisos",
                        description: "Barrer y trapear a fondo alrededor de la barra.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Reposición Final de Insumos",
                        description: "Dejar servilleteros y consumibles listos para apertura.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Orden Final de Barra",
                        description: "Área completamente seca y organizada.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Rellenar Refrigeradores Cerveza",
                        description: "Llenar refris para tener cerveza fría en la apertura.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Checar Máquina de Hielo",
                        description: "Dejar funcionando para tener hielo al día siguiente.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    }
                ]
            }
        }
    });

    return { success: true, message: "Plantilla de Barra creada correctamente.", templateId: template.id };
}

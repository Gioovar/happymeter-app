'use server';

import { prisma } from '@/lib/prisma';

export async function seedFloorTemplate() {
    console.log("Seeding Floor Template...");

    const templateName = "Plantilla Salón - Montaje y Limpieza";

    // Check if it already exists to avoid duplicates
    const existing = await prisma.processTemplate.findFirst({
        where: { name: templateName }
    });

    if (existing) {
        return { success: false, message: "La plantilla de Salón ya existe." };
    }

    const template = await prisma.processTemplate.create({
        data: {
            name: templateName,
            description: "Checklist operativo para Salón y Baños: Montaje previo, Limpieza profunda y Cierre. Incluye tecnología y exteriores.",
            category: "Salón",
            tasks: {
                create: [
                    // Opening (Montaje) - 14:00 (2 PM) Limit
                    {
                        title: "Montaje - Exteriores y Entrada",
                        description: "Barrer calle, limpiar frente. Colocar lámparas, encender anuncios. Área recepción limpia.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Montaje - Mobiliario Salón",
                        description: "Mesas y bancos limpios (Fabuloso), bien colocados. Cartas limpias.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Montaje - Pisos y Detalles",
                        description: "Piso trapeado (cloro/desengrasante). Sin basura en esquinas. Ventiladores/Lámparas limpios.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Montaje - Tecnología",
                        description: "Internet, Comanderas, Pantallas, Bocinas, Iluminación funcionando al 100%.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Montaje - Letrero LED",
                        description: "Colocar y asegurar letrero LED con promoción visible. Conectar a luz.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Montaje - Baños Listos",
                        description: "WC, lavamanos, mingitorios impecables. Piso tallado. Papel, jabón y sanitas repuestos.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },

                    // Mid-Shift (Limpieza) - 20:00 (8 PM) Limit - Range 6pm-8pm
                    {
                        title: "Mitad de Turno - Limpieza Salón",
                        description: "Barrer/trapear pasillos. Limpiar mesas/sillas. Vaciar botes basura. Orden general.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Limpieza Baños",
                        description: "Repasar limpieza lavabos/WC. Trapear piso. Reponer insumos. Vaciar basura.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },

                    // Closing (Cierre) - 02:00 AM Limit
                    {
                        title: "Cierre - Salón Completo",
                        description: "Limpieza profunda: barrer, trapear, desinfectar mesas/sillas. Cartas ordenadas. Basura fuera.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Baños Profundo",
                        description: "Tallar y desinfectar WC, mingitorios, lavabos (sin sarro). Piso y paredes limpios. Basura fuera.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Tecnología y Apagado",
                        description: "Apagar pantallas, PC, bocinas (NO DVR). Limpiar equipos. Cables ordenados.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    }
                ]
            }
        }
    });

    return { success: true, message: "Plantilla de Salón creada correctamente.", templateId: template.id };
}

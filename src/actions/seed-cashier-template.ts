'use server';

import { prisma } from '@/lib/prisma';

export async function seedCashierTemplate() {
    console.log("Seeding Cashier Template...");

    const templateName = "Plantilla de Caja - Operación Completa";

    // Check if it already exists to avoid duplicates
    const existing = await prisma.processTemplate.findFirst({
        where: { name: templateName }
    });

    if (existing) {
        return { success: false, message: "La plantilla de Caja ya existe." };
    }

    const template = await prisma.processTemplate.create({
        data: {
            name: templateName,
            description: "Checklist integral para la operación diaria de Caja: Apertura, Mitad de Turno y Cierre. Incluye manejo de efectivo, terminales, limpieza y cortes.",
            category: "Caja",
            tasks: {
                create: [
                    // Opening (Apertura) - 2:00 PM Limit
                    {
                        title: "Apertura - Verificación de Terminales",
                        description: "Encendidas, batería 100%, señal y rollo de papel. Conectadas si no se usan.",
                        defaultLimitTime: "14:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Apertura - Asignación de Terminales",
                        description: "Ubicar estratégicamente en puntos de mayor uso.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Chequeo de Equipos",
                        description: "Tablets, comanderas y software funcionando, actualizados y con red.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Propineras Limpias",
                        description: "Sin residuos, vacías del turno anterior y en su lugar.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Verificación Fondo de Caja",
                        description: "Confirmar monto completo para operar.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Disponibilidad de Cambio",
                        description: "Suficientes monedas y billetes de diversas denominaciones.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Apertura - Reposición de Faltantes",
                        description: "Reportar y reponer cualquier faltante antes de abrir.",
                        defaultLimitTime: "14:00",
                        evidenceType: "PHOTO"
                    },

                    // Mid-Shift (Mitad de Turno) - 20:00 (8 PM) Limit (Range 6pm-8pm)
                    {
                        title: "Mitad de Turno - Limpieza Área Caja",
                        description: "Limpiar mostrador, teclado, pantalla y equipos.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Organización Dinero",
                        description: "Acomodar billetes, monedas y comprobantes en sus espacios.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Mitad de Turno - Gestión Basura",
                        description: "Retirar papeles y objetos innecesarios.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Rollos de Papel",
                        description: "Verificar existencia de rollos para tickets.",
                        defaultLimitTime: "20:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Mitad de Turno - Verificación General",
                        description: "Área limpia, ordenada y funcional para seguir operando.",
                        defaultLimitTime: "20:00",
                        evidenceType: "VIDEO"
                    },

                    // Closing (Cierre) - 02:00 AM Limit
                    {
                        title: "Cierre - Limpieza Área Caja",
                        description: "Desinfectar mostrador, pantallas y equipos.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Organización Dinero",
                        description: "Ordenar efectivo y vouchers correctamente.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Gestión Basura",
                        description: "Área despejada de papeles y basura.",
                        defaultLimitTime: "02:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Cierre - Rollos de Papel",
                        description: "Asegurar stock de papel para el día siguiente.",
                        defaultLimitTime: "02:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Cierre - Verificación General",
                        description: "Punto de venta listo para el siguiente turno.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Revisión Corte de Caja",
                        description: "Cuadrar ventas, efectivo, terminales y propinas.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Embolsado de Corte",
                        description: "Etiquetar sobres con desglose completo y firma.",
                        defaultLimitTime: "02:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Cierre - Verificación Anomalías",
                        description: "Reportar diferencias, errores o billetes falsos.",
                        defaultLimitTime: "02:00",
                        evidenceType: "PHOTO"
                    },
                    {
                        title: "Cierre - Entrega de Cortes",
                        description: "Entregar cortes firmados y listos para control.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    },
                    {
                        title: "Cierre - Depósito en Caja Fuerte",
                        description: "Resguardar corte y sobres en la caja fuerte.",
                        defaultLimitTime: "02:00",
                        evidenceType: "VIDEO"
                    }
                ]
            }
        }
    });

    return { success: true, message: "Plantilla de Caja creada correctamente.", templateId: template.id };
}


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Process Templates for "Salón"...');

    // 1. Create the Main Template
    const templateName = "Operación Estándar - Salón";

    // Check if exists to avoid duplicates
    const existing = await prisma.processTemplate.findFirst({
        where: { name: templateName }
    });

    if (existing) {
        console.log(`⚠️ Template "${templateName}" already exists. Skipping.`);
        return;
    }

    const template = await prisma.processTemplate.create({
        data: {
            name: templateName,
            description: "Lista de tareas estándar para la operación diaria de Salón (Apertura, Medio Turno, Cierre)",
            category: "Salón"
        }
    });

    console.log(`✅ Created Template: ${template.name} (${template.id})`);

    // 2. Define Tasks based on User Input
    const tasks = [
        // --- APERTURA (2:00 PM) ---
        {
            title: "Apertura - Limpieza exterior del local",
            description: "Barrer y limpiar completamente la calle frente al local. Subir video y fotos.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Iluminación exterior y ambientación",
            description: "Colocar lámparas/series externas y encender anuncios luminosos. Verificar estado.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Limpieza profunda del piso",
            description: "Trapear todo el piso con cloro. Atención a áreas de alto tránsito.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Organización y limpieza del mobiliario",
            description: "Verificar mesas y bancos limpios, ordenados y alineados.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Servilleteros listos",
            description: "Servilleteros limpios y con suficiente papel en cada mesa.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Cartas listas",
            description: "Cartas libres de suciedad/grasa, ubicadas en cada mesa.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Control de basura y puntos ciegos",
            description: "Verificar esquinas, recepción, cabina DJ. Vaciar botes y poner bolsa nueva.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Ventilación e iluminación interior",
            description: "Limpiar y encender ventiladores. Revisar lámparas/candelabros.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Limpieza áreas clave (Caja/Recepción/DJ)",
            description: "Limpieza total de recepción, caja y cabina de DJ.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Verificación de Internet",
            description: "Confirmar conexión estable para sistema de pedidos/música.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Equipos de comandas operativos",
            description: "Comanderas de cocina y barra encendidas y conectadas.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Pantallas encendidas",
            description: "Todas las pantallas encendidas mostrando información correcta.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Sistema de sonido",
            description: "Bocinas conectadas, sonido claro sin interferencias.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Iluminación interna integral",
            description: "Todas las luces de salón, barra y exterior en buen estado.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Letrero LED Promociones",
            description: "Colocado, conectado y mostrando promociones vigentes.",
            time: "14:00",
            category: "Apertura"
        },
        {
            title: "Apertura - Limpieza de Baños",
            description: "Limpieza profunda, insumos repuestos, aromatizado. Pisos, WC, lavamanos.",
            time: "14:00",
            category: "Apertura"
        },

        // --- MITAD DE TURNO (6:00 PM - 8:00 PM) ---
        // Usaremos 19:00 (7 PM) como punto medio representativo para la alerta
        {
            title: "Mitad de Turno - Limpieza de Piso",
            description: "Repasar limpieza de pisos con cloro. Áreas de alto tráfico.",
            time: "19:00",
            category: "Medio Turno"
        },
        {
            title: "Mitad de Turno - Organización Mobiliario",
            description: "Re-alinear mesas y bancos. Verificar limpieza.",
            time: "19:00",
            category: "Medio Turno"
        },
        {
            title: "Mitad de Turno - Servilleteros",
            description: "Resurtir servilleteros si es necesario.",
            time: "19:00",
            category: "Medio Turno"
        },
        {
            title: "Mitad de Turno - Cartas",
            description: "Limpiar cartas que se hayan ensuciado.",
            time: "19:00",
            category: "Medio Turno"
        },
        {
            title: "Mitad de Turno - Control Basura",
            description: "Vaciar botes llenos. Verificar puntos ciegos.",
            time: "19:00",
            category: "Medio Turno"
        },
        {
            title: "Mitad de Turno - Áreas Clave",
            description: "Limpieza rápida de barra, caja y recepción.",
            time: "19:00",
            category: "Medio Turno"
        },
        {
            title: "Mitad de Turno - Baños",
            description: "Revisión estado baños. Reponer papel/jabón. Limpieza si requiere.",
            time: "19:00",
            category: "Medio Turno"
        },

        // --- CIERRE (2:00 AM) ---
        {
            title: "Cierre - Limpieza Profunda Piso",
            description: "Lavado final de pisos con cloro.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Organización Mobiliario",
            description: "Dejar mesas y sillas listas para el día siguiente (o subidas si aplica).",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Servilleteros",
            description: "Rellenar servilleteros para el turno de mañana.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Cartas",
            description: "Limpiar y guardar cartas ordenadamente.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Control Basura",
            description: "Sacar toda la basura del local. Dejar botes limpios con bolsa nueva.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Baños",
            description: "Lavado final y desinfección de baños.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Apagado Equipos Electrónicos",
            description: "Pantallas, PCs, impresoras, terminales, bocinas. EXCEPTO DVR.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Verificación DVR",
            description: "Confirmar que DVR (cámaras) queda ENCENDIDO y grabando.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Desconexión Auxiliares",
            description: "Humo, luces decorativas, cargadores desconectados.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Superficies Tecnológicas",
            description: "Limpiar polvo de mesas, consolas, racks.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Cables y Accesorios",
            description: "Recoger y ordenar cables sueltos.",
            time: "02:00",
            category: "Cierre"
        },
        {
            title: "Cierre - Áreas Clave",
            description: "Limpieza final recepción/caja.",
            time: "02:00",
            category: "Cierre"
        }
    ];

    console.log(`📝 Preparing to create ${tasks.length} tasks...`);

    for (const task of tasks) {
        await prisma.processTemplateTask.create({
            data: {
                templateId: template.id,
                title: task.title,
                description: task.description,
                defaultLimitTime: task.time,
                evidenceType: 'PHOTO', // Default to Photo
                isRequired: true
            }
        });
    }

    console.log('✨ All tasks seeded successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

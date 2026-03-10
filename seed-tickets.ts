import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTickets() {
    // Find the "Pruebas Gabriel" branch directly
    const branch = await prisma.chainBranch.findFirst({
        where: { name: { contains: "Pruebas Gabriel" } }
    })

    const targetId = branch?.branchId

    if (!targetId) {
        console.log("Could not find a valid branch ID 'Pruebas Gabriel' to seed against.")
        process.exit(1)
    }

    console.log(`Seeding tickets for Target ID: ${targetId}`)

    const tickets = [
        {
            title: "Cierra Tarde Frecuente",
            description: "La IA ha detectado menciones recurrentes sobre que el local cierra antes de lo indicado en Google Maps. 3 opiniones con quejas en la última semana.",
            status: "OPEN",
            severity: "HIGH",
            category: "Service",
            urgency: "HIGH"
        },
        {
            title: "Protocolo de Limpieza Baños",
            description: "Se han identificado 2 encuestas quejándose del estado de los baños entre las 9PM y 11PM. Requiere atención a los flujos operativos de esa zona.",
            status: "IN_PROGRESS",
            severity: "MEDIUM",
            category: "Cleanliness",
            urgency: "MEDIUM"
        },
        {
            title: "Mesa 4 tambalea",
            description: "Cliente reportó inestabilidad severa en Mesa 4 de la terraza.",
            status: "RESOLVED",
            severity: "LOW",
            category: "Maintenance",
            urgency: "LOW"
        },
        {
            title: "Comida fría (Plato Fuerte)",
            description: "Alarma detectada: Un usuario con influencia crítica (Local Guide) amenazó con reseña de 1 estrella si la temperatura de los cortes sigue saliendo baja.",
            status: "OPEN",
            severity: "CRITICAL",
            category: "Food",
            urgency: "CRITICAL"
        }
    ]

    for (const t of tickets) {
        await prisma.issueTicket.create({
            data: {
                businessId: targetId,
                title: t.title,
                description: t.description,
                status: t.status,
                severity: t.severity,
                category: t.category,
                urgency: t.urgency
            }
        })
    }

    console.log("✅ Seed complete")
}

seedTickets()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

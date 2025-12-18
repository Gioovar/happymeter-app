
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding 3 new places...')

    const places = [
        {
            name: 'Terraza Cielo Rooftop',
            description: 'El rooftop más exclusivo de la ciudad con vista panorámica. Ambiente chic y coctelería de autor. Ideal para contenido de lifestyle y moda nocturna.',
            address: 'Av. Reforma 450, Piso 25, CDMX',
            coverImage: 'https://images.unsplash.com/photo-1570560258879-af7f8e1447ac?q=80&w=2574&auto=format&fit=crop', // Rooftop bar
            contactName: 'Sofía Ramirez',
            contactPhone: '+52 55 1234 5678',
            agreementDetails: 'Intercambio: $2,500 MXN en consumo de alimentos y bebidas.\nRequisitos: 1 Reel + 2 Stories etiquetando a @terrazacielo.\nRestricciones: No válido viernes y sábado después de las 8pm.',
            scheduleConfig: {
                allowedDays: [2, 3, 4], // Tue, Wed, Thu
                timeRange: { start: '18:00', end: '23:00' }
            },
            isActive: true
        },
        {
            name: 'Café Botánico',
            description: 'Un oasis verde en medio de la ciudad. Especialidad en brunch y café de especialidad. Espacios muy "instagrameables" con mucha luz natural.',
            address: 'Calle Colima 120, Roma Norte, CDMX',
            coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2694&auto=format&fit=crop', // Cafe
            contactName: 'Carlos Méndez',
            contactPhone: '+52 55 8765 4321',
            agreementDetails: 'Intercambio: Desayuno completo para 2 personas.\nRequisitos: 3 Stories durante la visita.\nRestricciones: Llegar antes de la 1pm para asegurar mesa.',
            scheduleConfig: {
                allowedDays: [1, 2, 3, 4, 5], // Mon-Fri
                timeRange: { start: '09:00', end: '13:00' }
            },
            isActive: true
        },
        {
            name: 'Studio Fit Pilates',
            description: 'Estudio boutique de Pilates Reformer. Diseño minimalista y elegante. Perfecto para contenido de wellness, deporte y vida saludable.',
            address: 'Homero 500, Polanco, CDMX',
            coverImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2670&auto=format&fit=crop', // Gym
            contactName: 'Ana Paula',
            contactPhone: '+52 55 5555 0000',
            agreementDetails: 'Intercambio: Clase de cortesía + Smoothie.\nRequisitos: 1 Story mencionando la clase.\nRestricciones: Uso de calcetines antiderrapantes obligatorio.',
            scheduleConfig: {
                allowedDays: [1, 3, 5], // Mon, Wed, Fri
                timeRange: { start: '10:00', end: '15:00' }
            },
            isActive: true
        }
    ]

    for (const place of places) {
        await prisma.place.create({
            data: place
        })
        console.log(`✅ Created: ${place.name}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

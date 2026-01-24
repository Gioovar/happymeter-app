
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Social Media Achievements...')

    // Delete existing to avoid duplicates if re-run
    await prisma.achievement.deleteMany({})

    const achievements = [
        // LEVEL 1-5: VISIBILITY & BASIC SHARING
        {
            name: "Tu Primera Story",
            description: "Sube una historia en Instagram/TikTok mencionando a @happymeter desde una locación.",
            instructions: "1. Ve a cualquier locación activa.\n2. Grábate disfrutando la experiencia.\n3. Etiqueta a @happymeter y al lugar.\n4. Sube la evidencia (screenshot/link) aquí.",
            icon: "📸",
            level: 1,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 50
        },
        {
            name: "El Reseñador",
            description: "Sube un video corto (Reel/TikTok) de 15s mostrando un lugar.",
            instructions: "1. Crea un video vertical rápido.\n2. Muestra los puntos fuertes del lugar.\n3. Usa música en tendencia.\n4. Etiquétanos para repostearte.",
            icon: "🎥",
            level: 2,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 150
        },
        {
            name: "Tag Master",
            description: "Etiquétanos en 3 posts diferentes en tu feed.",
            instructions: "No importa si es carrusel o foto única. Queremos verte activo en el feed principal. Manda los 3 links.",
            icon: "🏷️",
            level: 3,
            type: "MANUAL",
            threshold: 3,
            rewardAmount: 300
        },
        {
            name: "Comunidad Activa",
            description: "Consigue 10 comentarios reales preguntando por el lugar.",
            instructions: "Sube contenido que genere curiosidad. '¿Dónde es eso?', '¡Invita!'. Manda screenshot de los comentarios.",
            icon: "💬",
            level: 4,
            type: "METRIC_THRESHOLD",
            metricKey: "comments",
            threshold: 10,
            rewardAmount: 400
        },
        {
            name: "Embajador Oficial",
            description: "Pon el link de HappyCreators en tu biografía por 1 semana.",
            instructions: "Ayúdanos a reclutar. Pon tu link de referido en la bio. Manda screenshot del inicio y final de la semana.",
            icon: "🔗",
            level: 5,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 500
        },

        // LEVEL 6-10: VIRALITY & REACH
        {
            name: "Micro-Viral",
            description: "Logra que un video supere las 2,000 vistas orgánicas.",
            instructions: "El algoritmo te ama. Manda link del video cuando pase los 2k views.",
            icon: "🔥",
            level: 6,
            type: "METRIC_THRESHOLD",
            metricKey: "views",
            threshold: 2000,
            rewardAmount: 600
        },
        {
            name: "Colaboración",
            description: "Haz un post colaborativo (Collab) con otro creador de HappyCreators.",
            instructions: "Júntate con alguien más de la plataforma. Vayan juntos a un lugar y suban Joint Post.",
            icon: "🤝",
            level: 7,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 800
        },
        {
            name: "TikTok Star",
            description: "Crea un TikTok usando nuestro audio oficial o trend de campaña.",
            instructions: "Revisa la sección 'Recursos de Marca' para ver el audio de la semana. Úsalo y diviértete.",
            icon: "🎵",
            level: 8,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 1000
        },
        {
            name: "Tendencia Local",
            description: "Tu contenido aparece en la ubicación del mapa de Instagram (Top posts).",
            instructions: "Si buscas el lugar en IG, ¿sales tú en destacados? Manda captura.",
            icon: "📍",
            level: 9,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 1200
        },
        {
            name: "El 10k Club",
            description: "Un solo video supera las 10,000 reproducciones.",
            instructions: "Esto ya es palabras mayores. Un hit viral real. ¡Felicidades!",
            icon: "🚀",
            level: 10,
            type: "METRIC_THRESHOLD",
            metricKey: "views",
            threshold: 10000,
            rewardAmount: 2000
        },

        // LEVEL 11-15: SALES & CONVERSION (Resultados Reales)
        {
            name: "Ventas Iniciadas",
            description: "Genera tus primeros $500 en comisiones por ventas.",
            instructions: "No solo likes, queremos ventas. Usa tu código de descuento.",
            icon: "💸",
            level: 11,
            type: "EARNINGS_THRESHOLD",
            threshold: 500,
            rewardAmount: 250
        },
        {
            name: "Tráfico Web",
            description: "Consigue 100 clics en tu enlace de afiliado.",
            instructions: "Mueve tráfico a nuestra web. Lo rastreamos automáticamente.",
            icon: "🖱️",
            level: 12,
            type: "MANUAL",
            threshold: 100,
            rewardAmount: 500
        },
        {
            name: "Cliente Frecuente",
            description: "Un cliente compró 2 veces usando tu código.",
            instructions: "Fidelización. Si logras que alguien repita, eres un crack.",
            icon: "🔄",
            level: 13,
            type: "MANUAL",
            threshold: 2,
            rewardAmount: 1000
        },
        {
            name: "Super Vendedor",
            description: "Genera $2,000 USD en ventas totales para la marca.",
            instructions: "Ventas acumuladas verificadas en tu dashboard.",
            icon: "💎",
            level: 14,
            type: "EARNINGS_THRESHOLD",
            threshold: 2000,
            rewardAmount: 1500
        },
        {
            name: "Brand Leader",
            description: "Lidera la tabla de posiciones mensual.",
            instructions: "Sé el #1 del mes en ventas o interacción.",
            icon: "🏆",
            level: 15,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 2000
        },

        // LEVEL 16-20: LEGENDARY PARTNER
        {
            name: "Imagen Oficial",
            description: "Tu cara aparece en nuestros anuncios pagados (Ads).",
            instructions: "Nos gustó tanto tu contenido que queremos pautarlo. Firma permiso de uso.",
            icon: "⭐",
            level: 16,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 3000
        },
        {
            name: "Speaker",
            description: "Participa en un Live o Webinar con nosotros.",
            instructions: "Te invitamos a hablarle a la comunidad en vivo.",
            icon: "🎙️",
            level: 17,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 4000
        },
        {
            name: "Viaje Pagado",
            description: "Ganador del retiro anual de creadores.",
            instructions: "Premio exclusivo para el Top 1% anual.",
            icon: "✈️",
            level: 18,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 5000
        },
        {
            name: "Socio",
            description: "Obtén acciones o Profit Sharing trimestral.",
            instructions: "Nivel ejecutivo. Solo por invitación.",
            icon: "💼",
            level: 19,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 10000
        },
        {
            name: "HAPPY GOD",
            description: "Has completado todos los hitos posibles.",
            instructions: "Eres leyenda.",
            icon: "👑",
            level: 20,
            type: "MANUAL",
            threshold: 1,
            rewardAmount: 50000
        }
    ]

    for (const ach of achievements) {
        await prisma.achievement.create({
            data: {
                ...ach,
                isActive: true
            }
        })
    }

    console.log('✅ Created 20 Social-Focused Achievements!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

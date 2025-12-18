
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Usage: npx tsx scripts/set-admin.ts tu-email@ejemplo.com

async function main() {
    const email = process.argv[2]
    if (!email) {
        console.error('❌ Por favor proporciona el email del usuario.')
        console.error('Ejemplo: npx tsx scripts/set-admin.ts admin@happymeter.com')
        process.exit(1)
    }

    console.log(`🔍 Buscando usuario con email (via Clerk/Webhook sync?)...`)
    // Note: Since we don't store email directly in UserSettings (it's in Clerk), 
    // we might need to find by match if we stored it, or ask for userId?
    // Wait, UserSettings doesn't usually store email unless added to schema.
    // schema.prisma: UserSettings has `userId` (clerk ID). Profile might have email?
    // Let's check schema again.

    // Schema check: 
    // model UserSettings { userId String @unique ... }
    // It relies on Clerk ID. 
    // BUT, we often don't have the email in PG.

    // Alternative: Ask for userId? Or assuming we might have synced it somewhere?
    // model Response { customerEmail ... }
    // model AffiliateProfile { paypalEmail ... }

    // If the webhook synced data, we might not have email in UserSettings.
    // BUT the user knows their Clerk ID? Unlikely.

    // Let's list all users and let them choose, or try to hack it.
    // Or better: Just list all users created and ask which one to promote.

    const users = await prisma.userSettings.findMany()

    if (users.length === 0) {
        console.log("❌ No se encontraron usuarios en la base de datos.")
        console.log("👉 Primero regístrate en la aplicación (localhost:3000) para que se cree tu usuario.")
        return
    }

    console.log(`📋 Usuarios encontrados (${users.length}):`)
    users.forEach((u, i) => {
        console.log(`${i + 1}. ID: ${u.userId} | Role: ${u.role} | Created: ${u.createdAt.toISOString()}`)
    })

    if (users.length === 1) {
        const u = users[0]
        console.log(`\n✨ Solo hay 1 usuario. Promoviendo a ${u.userId} a SUPER_ADMIN...`)
        await prisma.userSettings.update({
            where: { id: u.id },
            data: { role: 'SUPER_ADMIN' }
        })
        console.log("✅ ¡Listo! Ahora eres Administrador.")
    } else {
        console.log("\n⚠️ Hay más de 1 usuario. Para promover uno específico, edita este script o limpia la DB de nuevo.")
        console.log("O simplemente se promoverá el último creado:")

        const lastUser = users[users.length - 1] // Simple heuristic
        console.log(`Promoviendo a último usuario: ${lastUser.userId}...`)
        await prisma.userSettings.update({
            where: { id: lastUser.id },
            data: { role: 'SUPER_ADMIN' }
        })
        console.log("✅ ¡Listo! Usuario promovido.")
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

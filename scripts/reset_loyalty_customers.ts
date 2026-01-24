
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("🗑️  Resetting Loyalty Customers...")

    try {
        const result = await prisma.loyaltyCustomer.deleteMany({})
        console.log(`✅ Successfully deleted ${result.count} loyalty customers.`)
    } catch (error) {
        console.error("❌ Error deleting loyalty customers:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()

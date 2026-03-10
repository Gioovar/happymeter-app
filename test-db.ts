import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Checking recent deleted/existing surveys...")
    const usersWithSurveys = await prisma.survey.groupBy({
        by: ['userId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
    })
    console.log("Users and survey counts:", usersWithSurveys.slice(0, 10))
    
    // Check if there are any orphaned surveys, or check the total count
    const totalSurveys = await prisma.survey.count()
    console.log("Total surveys:", totalSurveys)
    
    // Check userSettings
    const settings = await prisma.userSettings.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    })
    console.log("Recent UserSettings:", settings)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OLD_USER_ID = 'user_36zT5iakWJbn4MQNg76Dvdz4FKa'
const NEW_USER_ID = 'user_37SFLGasdoohPrkDVUI05nFppHx'

async function main() {
    console.log('--- Verification Status ---')

    const oldUser = await prisma.userSettings.findUnique({ where: { userId: OLD_USER_ID } })
    const newUser = await prisma.userSettings.findUnique({ where: { userId: NEW_USER_ID } })

    console.log(`Old User Exists: ${!!oldUser}`)
    console.log(`New User Exists: ${!!newUser}`)

    const oldSurveys = await prisma.survey.count({ where: { userId: OLD_USER_ID } })
    const newSurveys = await prisma.survey.count({ where: { userId: NEW_USER_ID } })

    console.log(`Old Surveys: ${oldSurveys}`)
    console.log(`New Surveys: ${newSurveys}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

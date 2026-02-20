
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const taskTitle = 'Cartas listas'

    // Find the task
    const task = await prisma.processTask.findFirst({
        where: {
            title: { contains: taskTitle },
            // Filter by branch just to be safe
            zone: { OR: [{ userId: 'user_39rALJ1Z66nz5DrNiyr1Q6gK4IJ' }, { branchId: 'user_39rALJ1Z66nz5DrNiyr1Q6gK4IJ' }] }

        },
        select: { id: true, title: true, days: true }
    })

    if (!task) {
        console.log("Task not found")
        return
    }

    console.log(`Task: ${task.title}`)
    console.log(`Days: ${JSON.stringify(task.days)}`)

    const today = new Date()
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayStr = dayMap[today.getDay()]
    console.log(`Today (Local System): ${todayStr}`)
    // Note: Server timezone might differ but usually day logic is consistent if days are standard English strings.

    if (!task.days.includes(todayStr)) {
        console.log("CONCLUSION: Task is NOT valid for today!")
    } else {
        console.log("CONCLUSION: Task IS valid for today.")
    }

}

main()
    .catch(e => {
        console.error(e)
        プロセス.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const chains = await prisma.chain.findMany({
        include: {
            branches: {
                include: {
                    branch: { select: { userId: true, businessName: true } }
                }
            }
        }
    })

    console.log('\n=== APLICANDO FIX ===\n')
    let fixed = 0

    for (const chain of chains) {
        const firstBranch = chain.branches.find(b => b.order === 0 || b.branchId === chain.ownerId)
        if (!firstBranch) continue

        const isAffected = firstBranch.name === chain.name || firstBranch.name === 'Sede Principal'
        if (!isAffected) continue

        const correctName = firstBranch.branch.businessName || 'Sucursal Principal'

        await prisma.chainBranch.update({
            where: { id: firstBranch.id },
            data: { name: correctName }
        })

        console.log(`✅ Cadena "${chain.name}": "${firstBranch.name}" → "${correctName}"`)
        fixed++
    }

    console.log(`\nTotal corregidos: ${fixed}\n`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

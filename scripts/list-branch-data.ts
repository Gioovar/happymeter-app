
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const chains = await prisma.chain.findMany({
        include: {
            branches: true,
            owner: { select: { userId: true, businessName: true } }
        }
    })

    console.log('Found chains:', chains.length)
    for (const chain of chains) {
        console.log(`Chain: ${chain.name} (Owner ID: ${chain.owner.userId}, Name: ${chain.owner.businessName})`)
        for (const branch of chain.branches) {
            console.log(`  - Branch: ${branch.name || 'Unnamed'} (ID: ${branch.branchId}) slug: ${branch.slug}`)

            const responseCount = await prisma.response.count({
                where: { survey: { userId: branch.branchId } }
            })
            console.log(`    -> Responses count: ${responseCount}`)
        }
    }
}

main()

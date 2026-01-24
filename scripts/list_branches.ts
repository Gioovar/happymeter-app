import { prisma } from '@/lib/prisma'

async function listBranches() {
    const branches = await prisma.chainBranch.findMany({
        include: {
            chain: {
                include: {
                    owner: true
                }
            }
        }
    })

    console.log('--- Branches ---')
    branches.forEach(b => {
        console.log(`Name: ${b.name} | Slug: ${b.slug} | Owner: ${b.chain.owner.email} | BranchID: ${b.branchId}`)
    })
}

listBranches()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

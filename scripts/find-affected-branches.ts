import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Find ChainBranch records where the branch name matches the Chain name
    // (these are the ones incorrectly renamed by the bug)
    const chains = await prisma.chain.findMany({
        include: {
            branches: {
                include: {
                    branch: {
                        select: {
                            userId: true,
                            businessName: true,
                            fullName: true
                        }
                    }
                }
            }
        }
    })

    console.log('\n=== CADENAS Y SUCURSALES AFECTADAS ===\n')

    let affected = 0

    for (const chain of chains) {
        const firstBranch = chain.branches.find(b => b.order === 0 || b.branchId === chain.ownerId)

        if (!firstBranch) continue

        const branchNameMatchesChain = firstBranch.name === chain.name
        const branchNameIsSedePrincipal = firstBranch.name === 'Sede Principal'
        const originalBusinessName = firstBranch.branch.businessName

        const isAffected = branchNameMatchesChain || branchNameIsSedePrincipal

        if (isAffected) {
            affected++
            console.log(`Cadena: "${chain.name}" (id: ${chain.id})`)
            console.log(`  Sucursal principal (branchId: ${firstBranch.branchId})`)
            console.log(`  Nombre actual en ChainBranch: "${firstBranch.name}"`)
            console.log(`  businessName real en UserSettings: "${originalBusinessName}"`)
            console.log(`  Nombre completo: ${firstBranch.branch.fullName || 'N/A'}`)
            console.log(`  ¿Afectado?: ${branchNameMatchesChain ? 'Sí (nombre = cadena)' : 'Sí (Sede Principal)'}`)
            console.log()
        } else {
            console.log(`Cadena: "${chain.name}" → Sucursal: "${firstBranch.name}" ✅ OK`)
        }
    }

    console.log(`\nTotal afectados: ${affected} / ${chains.length} cadenas\n`)

    // Also show fix SQL for confirmation
    if (affected > 0) {
        console.log('=== FIX DISPONIBLE ===')
        console.log('Ejecuta scripts/fix-affected-branches.ts para corregir estos registros.\n')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

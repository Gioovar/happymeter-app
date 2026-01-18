import { prisma } from '@/lib/prisma'

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
}

async function backfillSlugs() {
    const branches = await prisma.chainBranch.findMany({
        where: { slug: null }
    })

    console.log(`Found ${branches.length} branches without slug.`)

    for (const branch of branches) {
        let slug = slugify(branch.name)
        // Ensure uniqueness roughly (good enough for migration of 2 branches)
        const exists = await prisma.chainBranch.findFirst({ where: { slug } })
        if (exists) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`
        }

        await prisma.chainBranch.update({
            where: { id: branch.id },
            data: { slug }
        })
        console.log(`Updated ${branch.name} -> ${slug}`)
    }
}

backfillSlugs()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

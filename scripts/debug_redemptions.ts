
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    console.log("🔍 Simulating Server Action Logic...")

    try {
        const redemptions = await prisma.loyaltyRedemption.findMany({
            orderBy: { redeemedAt: 'desc' },
            include: {
                program: { select: { businessName: true } }
            }
        })

        console.log(`Found ${redemptions.length} total redemptions.`)

        const rawStaffIds = Array.from(new Set(redemptions.map(r => r.staffId).filter(Boolean))) as string[]

        console.log(`Unique Staff IDs: ${rawStaffIds.length}`)
        console.log(rawStaffIds)

        if (rawStaffIds.length === 0) {
            console.log("No staff IDs found. Logic would return raw redemptions.")
            return
        }

        const clerkIds = new Set<string>()
        const teamMemberIds = new Set<string>()

        // Classify
        rawStaffIds.forEach(id => {
            if (id === 'SYSTEM') return
            if (id.startsWith('user_')) {
                clerkIds.add(id)
            } else {
                console.log(`👉 Detected TeamMember/UUID: ${id}`)
                teamMemberIds.add(id)
            }
        })

        // Resolve UUIDs
        const teamMemberMap = new Map<string, string>()
        if (teamMemberIds.size > 0) {
            console.log("Resolving TeamMembers...")
            const members = await prisma.teamMember.findMany({
                where: { id: { in: Array.from(teamMemberIds) } },
                select: { id: true, userId: true }
            })
            members.forEach(m => {
                console.log(`  Mapped ${m.id} -> ${m.userId}`)
                teamMemberMap.set(m.id, m.userId)
                clerkIds.add(m.userId)
            })
        }

        const finalUserIds = Array.from(clerkIds)
        console.log(`Final Clerk IDs to fetch: ${finalUserIds.length}`)
        console.log("IDs:", finalUserIds)

        // Fetch Clerk
        let clerkUserMap = new Map()
        if (process.env.CLERK_SECRET_KEY && finalUserIds.length > 0) {
            console.log("Attempting Clerk API Fetch...")
            try {
                const idsParam = finalUserIds.map(id => `user_id=${id}`).join('&')
                // Note: If huge list, this URL might get too long. 
                // But for simulation let's try it.
                const url = `https://api.clerk.com/v1/users?limit=100&${idsParam}`

                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (res.ok) {
                    const data = await res.json()
                    console.log(`✅ Clerk API Success. Retrieved ${data.length} users.`)
                    data.forEach((u: any) => {
                        console.log(`   - ${u.id}: ${u.first_name} ${u.last_name}`)
                    })
                    clerkUserMap = new Map(data.map((u: any) => [u.id, u]))
                } else {
                    console.error("❌ Clerk API Error:", await res.text())
                }
            } catch (err) {
                console.error("❌ Clerk Fetch Exception:", err)
            }
        } else {
            console.warn("⚠️ SKIPPING Clerk Fetch: Missing CLERK_SECRET_KEY or No IDs.")
            console.log(`Env Key exists? ${!!process.env.CLERK_SECRET_KEY}`)
        }

        console.log("Simulation Complete.")

    } catch (e) {
        console.error("Simulation Failed:", e)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

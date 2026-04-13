import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Checking getOpsTasks logic for operator 123456...");
    const member = await prisma.teamMember.findUnique({
        where: { accessCode: '123456' }
    });

    if (!member) {
        console.log("Member not found!");
        return;
    }
    
    console.log("Found member:", { id: member.id, role: member.role, name: member.name });
    
    const dayOfWeek = new Date().getDay() || 7;
    console.log("Day of week integer:", dayOfWeek);

    const baseZoneWhere = {
        OR: [
            { userId: member.ownerId },
            { branchId: member.ownerId }
        ]
    };

    const isRestrictedRole = !['ADMIN', 'SUPERVISOR'].includes(member.role);
    console.log("Is restricted:", isRestrictedRole);

    const zones = await prisma.processZone.findMany({
        where: {
            ...baseZoneWhere,
            ...(isRestrictedRole ? {
                tasks: {
                    some: {
                        assignedStaffId: member.id,
                        days: { has: dayOfWeek }
                    }
                }
            } : {})
        },
        include: {
            tasks: {
                where: {
                    days: { has: dayOfWeek },
                    ...(isRestrictedRole ? { assignedStaffId: member.id } : {})
                }
            }
        }
    });

    console.log(`Initial Zones length: ${zones.length}`);
    const filtered = zones.filter(z => z.tasks.length > 0);
    console.log(`Filtered Zones length: ${filtered.length}`);
    
    filtered.forEach(z => {
        console.log(`- Zone ${z.name}: ${z.tasks.length} tasks`);
        const otherAssignedCount = z.tasks.filter(t => t.assignedStaffId !== member.id).length;
        if (otherAssignedCount > 0) {
            console.log(`  WARNING: Found ${otherAssignedCount} tasks assigned to SOMEONE ELSE!`);
        }
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());

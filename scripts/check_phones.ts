import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const settings = await prisma.userSettings.findMany({
        where: { isActive: true },
        select: { userId: true, businessName: true, phone: true }
    });

    console.log("Active User Settings Phone Numbers:")
    let validCount = 0;
    let nullCount = 0;
    let missingCountryCodeCount = 0;

    settings.forEach(s => {
        if (!s.phone) {
            console.log(`- ${s.businessName} (${s.userId.slice(0, 5)}...): NULL/Empty`);
            nullCount++;
            return;
        }

        if (!s.phone.startsWith('+')) {
            console.log(`- ${s.businessName} (${s.userId.slice(0, 5)}...): ${s.phone} (MISSING COUNTRY CODE)`);
            missingCountryCodeCount++;
            return;
        }

        console.log(`- ${s.businessName} (${s.userId.slice(0, 5)}...): ${s.phone} (OK)`);
        validCount++;
    });

    console.log(`\nSummary: \nValid: ${validCount} | Null: ${nullCount} | Missing Country Code: ${missingCountryCodeCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

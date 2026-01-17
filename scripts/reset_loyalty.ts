
import { prisma } from '../src/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

async function main() {
    try {
        console.log("🛡️ Starting Loyalty Reset Protocol...");

        // 1. Backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(process.cwd(), 'backups', 'loyalty_reset_' + timestamp);
        await fs.mkdir(backupDir, { recursive: true });

        const customers = await prisma.loyaltyCustomer.findMany({
            include: {
                visits: true,
                redemptions: true
            }
        });

        const backupFile = path.join(backupDir, 'loyalty_customers.json');
        await fs.writeFile(backupFile, JSON.stringify(customers, null, 2));
        console.log(`✅ Backup saved: ${customers.length} profiles to ${backupFile}`);

        // 2. Delete
        if (customers.length > 0) {
            console.log("⚠️ Deleting all Loyalty Customers...");
            // Due to cascading, deleting customers should delete visits/redemptions/points
            // But let's be thorough if cascade fails (though schema says cascade)
            // Actually, let's rely on cascade first.
            const result = await prisma.loyaltyCustomer.deleteMany({});
            console.log(`🗑️ Deleted ${result.count} loyalty customers.`);
        } else {
            console.log("ℹ️ No customers to delete.");
        }

    } catch (error) {
        console.error("❌ Error resetting loyalty data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

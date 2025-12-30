
import { prisma } from '../src/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', timestamp);

    console.log(`Creating backup in: ${backupDir}`);
    await fs.mkdir(backupDir, { recursive: true });

    // 1. Users
    const users = await prisma.userSettings.findMany();
    await fs.writeFile(path.join(backupDir, 'users.json'), JSON.stringify(users, null, 2));
    console.log(`Saved ${users.length} users.`);

    // 2. Sales
    const sales = await prisma.sale.findMany();
    await fs.writeFile(path.join(backupDir, 'sales.json'), JSON.stringify(sales, null, 2));
    console.log(`Saved ${sales.length} sales.`);

    // 3. Surveys & Responses
    const surveys = await prisma.survey.findMany({ include: { questions: true } });
    await fs.writeFile(path.join(backupDir, 'surveys.json'), JSON.stringify(surveys, null, 2));

    const responses = await prisma.response.findMany();
    await fs.writeFile(path.join(backupDir, 'responses.json'), JSON.stringify(responses, null, 2));
    console.log(`Saved ${surveys.length} surveys and ${responses.length} responses.`);

    console.log('✅ Backup Complete!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

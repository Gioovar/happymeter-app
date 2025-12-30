
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
    console.log('--- RESTORING ACTIVE USERS ---');

    const emails = ['roykch85@gmail.com', 'armelzuniga87@gmail.com', 'gtrendy2017@gmail.com'];

    for (const email of emails) {
        console.log(`Searching for ${email}...`);
        const list = await clerk.users.getUserList({ emailAddress: [email] });

        if (list.data.length > 0) {
            const u = list.data[0];
            console.log(`Found Clerk User: ${u.id} (${u.firstName} ${u.lastName})`);

            // Check/Create UserSettings
            const exists = await prisma.userSettings.findUnique({ where: { userId: u.id } });
            if (!exists) {
                console.log(`- Restoring UserSettings for ${u.id}...`);
                await prisma.userSettings.create({
                    data: {
                        userId: u.id,
                        plan: 'FREE', // Default to free unless known otherwise
                        role: email === 'gtrendy2017@gmail.com' ? 'SUPER_ADMIN' : 'USER',
                        isOnboarded: true
                    }
                });
            } else {
                console.log(`- UserSettings already exist.`);
                if (email === 'gtrendy2017@gmail.com' && exists.role !== 'SUPER_ADMIN') {
                    await prisma.userSettings.update({ where: { userId: u.id }, data: { role: 'SUPER_ADMIN' } });
                    console.log('  -> Promoted to SUPER_ADMIN');
                }
            }

            // Restore Dummy Data for Giovanni (since he complained about empty dashboard)
            if (email === 'gtrendy2017@gmail.com') {
                const surveys = await prisma.survey.count({ where: { userId: u.id } });
                if (surveys === 0) {
                    console.log('- Restoring a demo survey for Giovanni...');
                    const s = await prisma.survey.create({
                        data: {
                            userId: u.id,
                            title: 'Encuesta Restaurante (Recuperada)',
                            isActive: true,
                            questions: {
                                create: [{ text: 'Califica tu experiencia', type: 'RATING', order: 0 }]
                            }
                        }
                    });
                    // Add some responses
                    await prisma.response.create({
                        data: {
                            surveyId: s.id,
                            customerName: 'Cliente Feliz',
                            answers: { create: [{ questionId: (await prisma.question.findFirst({ where: { surveyId: s.id } }))!.id, value: '5' }] }
                        }
                    });
                }
            }

        } else {
            console.log(`User ${email} not found in Clerk! Can't restore DB.`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

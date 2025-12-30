
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- RESTORING ROGELIO SURVEY ---');

    const userId = 'user_client_restaurante_01'; // Rogelio Placeholder

    // Check if survey exists
    const existing = await prisma.survey.findFirst({ where: { userId } });

    if (!existing) {
        console.log('Creating survey for Rogelio...');
        const survey = await prisma.survey.create({
            data: {
                userId,
                title: 'Encuesta Satisfacción General',
                description: 'Encuesta recuperada para Rogelio',
                isActive: true,
                questions: {
                    create: [
                        { text: '¿Del 1 al 10, qué tal la experiencia?', type: 'NPS', order: 0 },
                        { text: '¿Algún comentario adicional?', type: 'TEXT', order: 1 }
                    ]
                }
            }
        });

        console.log('Adding sample responses...');
        // 3 Responses
        const qId = (await prisma.question.findFirst({ where: { surveyId: survey.id, type: 'NPS' } }))!.id;

        await prisma.response.create({
            data: { surveyId: survey.id, customerName: 'Cliente 1', answers: { create: [{ questionId: qId, value: '10' }] } }
        });
        await prisma.response.create({
            data: { surveyId: survey.id, customerName: 'Cliente 2', answers: { create: [{ questionId: qId, value: '9' }] } }
        });
        await prisma.response.create({
            data: { surveyId: survey.id, customerName: 'Cliente 3', answers: { create: [{ questionId: qId, value: '10' }] } }
        });

        console.log('Survey and Responses Restored.');
    } else {
        console.log('Survey already exists for Rogelio.');
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

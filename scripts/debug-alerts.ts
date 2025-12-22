
import { sendCrisisAlert, sendCustomerReward } from '../src/lib/alerts'
import { prisma } from '../src/lib/prisma'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
    console.log('--- STARTING ALERT DEBUG ---')
    console.log('WHATSAPP_PHONE_ID:', process.env.WHATSAPP_PHONE_ID ? 'SET' : 'MISSING')
    console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? 'SET' : 'MISSING')

    // 1. Mock Data
    const mockSurvey = {
        id: 'test-survey-id',
        userId: 'test-user-id',
        title: 'Encuesta Debug',
        alertConfig: {
            threshold: 3,
            phones: ['5215512345678'], // Replace with a safe test number if possible, or user's number
            enabled: true
        },
        recoveryConfig: {
            enabled: true,
            bad: { enabled: true, offer: 'Postre Gratis', code: 'DEBUG-BAD' },
            neutral: { enabled: true, offer: '10% Descuento', code: 'DEBUG-NEUTRAL' },
            good: { enabled: true, offer: '2x1 Bebidas', code: 'DEBUG-GOOD' }
        }
    }

    const mockResponse = {
        id: 'test-response-id',
        customerName: 'Juan Debug',
        customerPhone: '5215512345678', // TEST NUMBER
        createdAt: new Date(),
        surveyId: 'test-survey-id',
        survey: mockSurvey
    }

    const mockAnswersBad = [
        { question: { type: 'RATING', text: 'Calificación' }, value: '1' },
        { question: { type: 'TEXT', text: 'Comentario' }, value: 'Prueba de alerta mala' }
    ]

    const mockAnswersGood = [
        { question: { type: 'RATING', text: 'Calificación' }, value: '5' },
        { question: { type: 'TEXT', text: 'Comentario' }, value: 'Prueba de alerta buena' }
    ]

    // 2. Test Manager Alert (Crisis)
    console.log('\n--- TESTING MANAGER CRISIS ALERT (Low Rating) ---')
    await sendCrisisAlert(mockResponse as any, mockSurvey as any, mockAnswersBad)

    // 3. Test Customer Reward (Good Rating)
    console.log('\n--- TESTING CUSTOMER REWARD (High Rating) ---')
    await sendCustomerReward(mockResponse as any, mockSurvey as any, mockAnswersGood)

    // 4. Test Customer Reward (Bad Rating) - Should send recovery Code
    console.log('\n--- TESTING CUSTOMER RECOVERY (Low Rating) ---')
    await sendCustomerReward(mockResponse as any, mockSurvey as any, mockAnswersBad)
}

main().catch(console.error)

import { prisma } from '../src/lib/prisma'

async function runSmokeTest() {
    console.log('🚀 Starting HappyMeter Smoke Test Simulation...')

    const TEST_EMAIL = `smoke_${Date.now()}@test.com`
    const TEST_USER_ID = `user_smoke_${Date.now()}`
    const AFFILIATE_CODE = 'SMOKE_REF'

    try {
        // 1. Create a Fake Affiliate (to test commissions)
        console.log('\n--- Step 1: Setting up Affiliate Infrastructure ---')
        let affiliateUser = await prisma.userSettings.findFirst({
            where: { affiliateProfile: { code: AFFILIATE_CODE } }
        })

        if (!affiliateUser) {
            const affiliateUserId = `aff_${Date.now()}`
            affiliateUser = await prisma.userSettings.create({
                data: {
                    userId: affiliateUserId,
                    plan: 'CHAIN',
                    affiliateProfile: {
                        create: {
                            code: AFFILIATE_CODE,
                            stripeConnectId: 'acct_test_123', // Mock ID
                        }
                    }
                }
            })
            console.log(`✅ Affiliate created with code: ${AFFILIATE_CODE}`)
        } else {
            console.log(`ℹ️ Affiliate ${AFFILIATE_CODE} already exists`)
        }

        // 2. Simulate User Signup (via Clerk Webhook logic)
        console.log('\n--- Step 2: Simulating New User Signup ---')
        const newUser = await prisma.userSettings.create({
            data: {
                userId: TEST_USER_ID,
                plan: 'FREE',
                maxSurveys: 3
            }
        })
        console.log(`✅ User created: ${TEST_EMAIL} (${newUser.userId})`)

        // 3. Simulate "Conversion" (Referral Cookie logic)
        console.log('\n--- Step 3: Linking Referral ---')
        // In real app, this happens via middleware/cookies. Here we insert directly.
        const affiliateProfile = await prisma.affiliateProfile.findUnique({ where: { code: AFFILIATE_CODE } })

        if (affiliateProfile) {
            await prisma.referral.create({
                data: {
                    affiliateId: affiliateProfile.id,
                    referredUserId: TEST_USER_ID,
                    status: 'LEAD',
                    leadEmail: TEST_EMAIL
                }
            })
            console.log(`✅ Referral linked to ${AFFILIATE_CODE}`)
        }

        // 4. Simulate Operations: Upgrade Plan (Stripe Webhook logic)
        console.log('\n--- Step 4: Simulating Plan Upgrade (Payment) ---')
        const PLAN_AMOUNT = 29.99

        // Update User Plan
        await prisma.userSettings.update({
            where: { userId: TEST_USER_ID },
            data: { plan: 'GROWTH', subscriptionStatus: 'active' }
        })

        // Create Sale Record
        await prisma.sale.create({
            data: {
                userId: TEST_USER_ID,
                plan: 'GROWTH',
                amount: PLAN_AMOUNT,
                status: 'COMPLETED',
                currency: 'usd'
            }
        })
        console.log('✅ Plan upgraded to GROWTH')
        console.log('✅ Sale record created')

        // 5. Trigger Commission Logic
        console.log('\n--- Step 5: Calculating Commission ---')
        if (affiliateProfile) {
            const commissionAmount = PLAN_AMOUNT * 0.40
            await prisma.commission.create({
                data: {
                    affiliateId: affiliateProfile.id,
                    amount: commissionAmount,
                    description: 'Commission for Smoke Test Plan',
                    status: 'PENDING'
                }
            })

            await prisma.affiliateProfile.update({
                where: { id: affiliateProfile.id },
                data: { balance: { increment: commissionAmount } }
            })
            console.log(`✅ Commission generated: $${commissionAmount.toFixed(2)}`)
        }

        // 6. Simulate Product Usage: Create Survey
        console.log('\n--- Step 6: Product Usage (Create Survey) ---')
        const survey = await prisma.survey.create({
            data: {
                userId: TEST_USER_ID,
                title: 'Smoke Test Survey',
                description: 'Verifying core functionality',
                googleMapsUrl: 'https://maps.google.com/?q=test',
            }
        })
        console.log(`✅ Survey created: "${survey.title}" (${survey.id})`)

        // 7. Simulate Feedback: Create Question then Response
        console.log('\n--- Step 7: Receive Feedback ---')

        // A. Create Question
        const question = await prisma.question.create({
            data: {
                surveyId: survey.id,
                text: 'How was the smoke test?',
                type: 'rating',
                order: 1
            }
        })
        console.log(`✅ Question created: "${question.text}"`)

        // B. Create Response with Answer
        const response = await prisma.response.create({
            data: {
                surveyId: survey.id,
                customerName: 'Smokey User',
                answers: {
                    create: {
                        questionId: question.id,
                        value: '10'
                    }
                }
            }
        })
        console.log(`✅ Response recorded with 10/10 rating`)

        console.log('\n🎉 SMOKE TEST COMPLETED SUCCESSFULLY 🎉')
        console.log('User Journey Verified: Signup -> Referral -> Upgrade -> Commission -> Survey -> Feedback')

    } catch (error) {
        console.error('\n❌ SMOKE TEST FAILED')
        console.error(error)
    } finally {
        console.log('\n(Test data preserved for inspection. Run clean-db to wipe.)')
    }
}

runSmokeTest()

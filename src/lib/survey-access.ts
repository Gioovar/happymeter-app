import { prisma } from '@/lib/prisma'

export async function verifySurveyAccess(surveyId: string, userId: string) {
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
    })

    if (!survey) return null

    // 1. Direct Ownership
    if (survey.userId === userId) return survey

    // 2. Chain Ownership
    // Check if the survey owner is a branch of a chain owned by the current user
    const branch = await prisma.chainBranch.findFirst({
        where: {
            branchId: survey.userId,
            chain: {
                ownerId: userId
            }
        }
    })

    if (branch) return survey

    return null
}

import { prisma } from '@/lib/prisma'

export async function verifySurveyAccess(surveyId: string, userId: string, requiredAction: 'VIEW' | 'EDIT' | 'DELETE' = 'VIEW') {
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
    })

    if (!survey) return null

    // 1. Direct Ownership (Full Access)
    if (survey.userId === userId) return survey

    // 2. Chain Ownership Check (Full Access)
    const branch = await prisma.chainBranch.findFirst({
        where: {
            branchId: survey.userId,
            chain: {
                ownerId: userId
            }
        }
    })

    if (branch) return survey

    // 3. Team Member Access Check
    const teamMember = await prisma.teamMember.findFirst({
        where: {
            userId: userId,
            ownerId: survey.userId,
            isActive: true
        }
    })

    if (!teamMember) return null

    // RBAC Rules based on TeamRole
    if (requiredAction === 'DELETE') {
        if (teamMember.role === 'ADMIN') return survey;
        return null; // EDITOR cannot delete
    }

    if (requiredAction === 'EDIT') {
        if (teamMember.role === 'ADMIN' || teamMember.role === 'EDITOR') return survey;
        return null;
    }

    // VIEW is allowed for active team members
    return survey
}

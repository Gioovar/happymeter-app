import { prisma } from "@/lib/prisma"

export async function processPromoterScore(responseId: string) {
    try {
        const response = await prisma.response.findUnique({
            where: { id: responseId },
            include: {
                answers: { include: { question: true } },
                reservation: { include: { promoter: true } }
            }
        });

        if (!response || !response.reservation?.promoter) return;

        const promoter = response.reservation.promoter;

        // Calculate Average Score from this survey (1 to 5 stars)
        let totalScore = 0;
        let count = 0;
        for (const ans of response.answers) {
            const val = parseFloat(ans.value);
            if (!isNaN(val) && val >= 1 && val <= 5) { // Assuming typical 1-5 star ratings
                totalScore += val;
                count++;
            } else if (!isNaN(val) && val > 5 && val <= 10 && ans.question.type === 'NPS') {
                // If they use NPS (0-10), we can map it to 5 stars.
                totalScore += (val / 2);
                count++;
            }
        }

        if (count === 0) return; // No numeric rating found in this survey

        const surveyAvg = totalScore / count;

        // Update Promoter Profile Score
        const currentReviews = promoter.totalReviews || 0;
        const currentScore = promoter.rpScore || 5.0;

        const newScore = ((currentScore * currentReviews) + surveyAvg) / (currentReviews + 1);

        await prisma.promoterProfile.update({
            where: { id: promoter.id },
            data: {
                rpScore: newScore,
                totalReviews: currentReviews + 1
            }
        });

        // Also update Global Promoter Score if linked
        if (promoter.userId) {
            const globalP = await (prisma as any).globalPromoter.findUnique({ where: { phone: promoter.userId } });
            if (globalP) {
                const gReviews = globalP.totalReviews || 0;
                const gScore = globalP.globalRpScore || 5.0;
                const newGScore = ((gScore * gReviews) + surveyAvg) / (gReviews + 1);

                await (prisma as any).globalPromoter.update({
                    where: { id: globalP.id },
                    data: {
                        globalRpScore: newGScore,
                        totalReviews: gReviews + 1
                    }
                });
            }
        }

    } catch (error) {
        console.error("Error processing promoter score:", error);
    }
}

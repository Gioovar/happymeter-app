import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import EditZoneForm from './EditZoneForm';
import { getTeamMembers, getPendingInvitations } from '@/actions/team-queries';

interface PageProps {
    params: {
        zoneId: string;
    }
}

export default async function ProcessDetailPage({ params }: PageProps) {
    const { userId } = await auth();
    if (!userId) return null;

    const [zone, teamMembers, pendingInvitations] = await Promise.all([
        prisma.processZone.findUnique({
            where: { id: params.zoneId, userId },
            include: {
                tasks: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        }),
        getTeamMembers(),
        getPendingInvitations()
    ]);

    if (!zone) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <EditZoneForm zone={zone} teamMembers={teamMembers} pendingInvitations={pendingInvitations} />
        </div>
    );
}

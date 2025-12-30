
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- AUDITING STAFF DATA ---');

    // 1. Place Visits
    const visits = await prisma.placeVisit.findMany({
        include: { creator: { select: { instagram: true } } }
    });
    console.log(`\nTotal Visits: ${visits.length}`);
    visits.slice(0, 10).forEach(v => {
        console.log(`- [${v.status}] ${v.placeName} by ${v.creator?.instagram || 'Unknown'}`);
    });

    // 2. Seller Leads
    const leads = await prisma.sellerLead.findMany();
    console.log(`\nTotal Seller Leads: ${leads.length}`);
    leads.slice(0, 10).forEach(l => {
        console.log(`- ${l.businessName} (Contact: ${l.contactName})`);
    });

    // 3. Staff Members
    const staffUsers = await prisma.userSettings.findMany({ where: { role: 'STAFF' } });
    console.log(`\nTotal Staff Users: ${staffUsers.length}`);
    staffUsers.forEach(u => console.log(`- ${u.userId}`));

    // 4. Places (Tenants)
    const places = await prisma.place.findMany();
    console.log(`\nTotal Places: ${places.length}`);
    places.slice(0, 10).forEach(p => console.log(`- ${p.name} (Status: ${p.status}, Creator: ${p.creatorId})`));

    // 5. Affiliates (Creators)
    const creators = await prisma.affiliateProfile.findMany();
    console.log(`\nTotal Creators: ${creators.length}`);
    creators.slice(0, 10).forEach(c => console.log(`- ${c.instagram || 'No IG'} (ID: ${c.id})`));

    // 6. Representatives (Sellers)
    const reps = await prisma.representativeProfile.findMany();
    console.log(`\nTotal Reps: ${reps.length}`);
    reps.slice(0, 10).forEach(r => console.log(`- ${r.fullName} (${r.state}) ID: ${r.id}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

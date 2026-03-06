import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
async function main() {
    const phone = "+525574131657";
    console.log("Looking up customer with phone:", phone);
    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { phone: phone },
                { phone: "5574131657" },
                { phone: "+52 55 7413 1657" }
            ]
        },
        include: {
            loyaltyCards: {
                include: { business: { select: { name: true } } }
            }
        }
    });
    console.log(JSON.stringify(customers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());

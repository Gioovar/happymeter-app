import { getAvailableTables } from '../src/actions/reservations';

async function test() {
    // Exact ISO string for Feb 18, 14:00 Local (Mexico UTC-6 -> 20:00 UTC)
    const targetDateIso = "2026-02-18T20:00:12.062Z";
    const floorPlanId = "f46c5e93-9dc5-46b5-8228-23252bb5e7e3";
    const programId = "f9a15a81-d1d4-4b5c-897c-7d9a1845bb08"; // Need to verify this
    const offset = 360; // Mexico h-6

    console.log("Simulating getAvailableTables...");
    const result = await getAvailableTables(targetDateIso, floorPlanId, undefined, offset);
    console.log("Result:", JSON.stringify(result, null, 2));
}

test();

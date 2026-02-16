function getMexicoTodayRangeSimulated(mockDate: Date) {
    // 2. Adjust to Mexico Time (UTC-6)
    const mexicoOffset = -6;
    const mexicoTime = new Date(mockDate.getTime() + (mexicoOffset * 60 * 60 * 1000));

    // 3. Cycle logic: If it's between 00:00 and 05:59, we are still in "yesterday operative cycle"
    const currentHour = mexicoTime.getUTCHours();
    const isEarlyMorning = currentHour < 6;

    // The "Anchor Date" for calculations
    const operativeDate = new Date(mexicoTime);
    if (isEarlyMorning) {
        operativeDate.setUTCDate(operativeDate.getUTCDate() - 1);
    }

    // 4. Start: 06:00 AM of the anchor date (Mexico Time)
    const start = new Date(operativeDate);
    start.setUTCHours(6 - mexicoOffset, 0, 0, 0);

    // 5. End: 05:59 AM of the next calendar day (Mexico Time)
    const end = new Date(start);
    end.setUTCHours(end.getUTCHours() + 23, 59, 59, 999);

    // 6. Day of week for task recurrence selection (Uses the operative date)
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = dayMap[operativeDate.getUTCDay()];

    console.log(`[MOCK: ${mexicoTime.toISOString()} (${currentHour}h)]`);
    console.log(`   - Operative Day: ${operativeDate.toISOString().split('T')[0]}`);
    console.log(`   - Start: ${start.toISOString()}`);
    console.log(`   - End: ${end.toISOString()}`);
    console.log(`   - DayOfWeek: ${dayOfWeek}`);
}

console.log("--- TEST 1: Regular Day Hours (Monday 2:00 PM Mexico) ---");
const test1UTC = new Date("2026-02-16T20:00:00Z"); // 2:00 PM Mexico
getMexicoTodayRangeSimulated(test1UTC);

console.log("\n--- TEST 2: Night Shift (Tuesday 2:00 AM Mexico) ---");
const test2UTC = new Date("2026-02-17T08:00:00Z"); // 2:00 AM Mexico
getMexicoTodayRangeSimulated(test2UTC);

console.log("\n--- TEST 3: Edge Case (Monday 5:59 AM Mexico) ---");
const test3UTC = new Date("2026-02-16T11:59:00Z"); // 5:59 AM Mexico
getMexicoTodayRangeSimulated(test3UTC);

console.log("\n--- TEST 4: Edge Case (Monday 6:01 AM Mexico) ---");
const test4UTC = new Date("2026-02-16T12:01:00Z"); // 6:01 AM Mexico
getMexicoTodayRangeSimulated(test4UTC);

'use client'

import { usePushNotifications } from "@/hooks/usePushNotifications"

export default function OpsPushInitializer({ userId, memberId }: { userId: string | null, memberId: string }) {
    usePushNotifications('OPS', userId, memberId);
    return null; // Invisible component strictly for registering the device token via Capacitor / Service Workers
}


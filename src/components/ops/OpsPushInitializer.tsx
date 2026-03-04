'use client'

import { usePushNotifications } from "@/hooks/usePushNotifications"

export default function OpsPushInitializer({ userId }: { userId: string }) {
    usePushNotifications('OPS', userId);
    return null; // Invisible component strictly for registering the device token via Capacitor / Service Workers
}

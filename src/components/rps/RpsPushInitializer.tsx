'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function RpsPushInitializer({ globalPromoterId }: { globalPromoterId: string }) {
    usePushNotifications('RPS', globalPromoterId);
    return null;
}

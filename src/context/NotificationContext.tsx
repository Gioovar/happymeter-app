'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useDashboardRouter } from '@/hooks/useDashboardRouter'

interface Notification {
    id: string
    title: string
    message: string
    isRead: boolean
    type: string
    createdAt: string
    meta?: any
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id?: string) => Promise<void>
    deleteRead: () => Promise<void>
    testSound: () => void
    loadingId: string | null
    setLoadingId: (id: string | null) => void
    requestPushPermission: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const lastNotificationIdRef = useRef<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const { navigateTo, branchSlug, push: rootPush } = useDashboardRouter()
    const { userId } = useAuth()

    // Push Notifications Hook
    const { askPermission } = usePushNotifications('OPS', userId || null)

    // Initialize Web Audio API
    const playSound = async () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const audioCtx = new AudioContext();

            // Resume context if suspended
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            const response = await fetch('/notification.mp3');
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
        } catch (error) {
            console.log('Audio playback prevented:', error);
        }
    }


    const testSound = () => playSound()

    // Navigation Logic
    const handleNotificationClick = (notif: Notification) => {
        setLoadingId(notif.id)

        // Optimistic Read
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        // API Call (Fire and forget from read perspective, we handle nav separately)
        fetch('/api/notifications', {
            method: 'PATCH',
            body: JSON.stringify({ notificationId: notif.id, markAll: false })
        }).catch(console.error)

        // Navigation
        if (notif.meta?.responseId) {
            navigateTo('responses')
            // Add parameter context if supported or wait via URL param handling
            // NOTE: The dictionary current implementation does not take responseId explicitly
            // But we can append queries naturally or enhance the dictionnary, using push directly on known params
            rootPush(`/dashboard/${branchSlug ? branchSlug + '/' : ''}responses?responseId=${notif.meta.responseId}`)
        } else if (notif.meta?.url) {
            rootPush(notif.meta.url)
        } else if (notif.type === 'ACHIEVEMENT') {
            navigateTo('achievements')
        } else if (notif.type === 'REPORT') {
            const endDate = new Date(notif.createdAt)
            const startDate = new Date(endDate)
            startDate.setDate(endDate.getDate() - 15)
            const query = new URLSearchParams({
                auto: 'true',
                from: startDate.toISOString(),
                to: endDate.toISOString()
            }).toString()

            if (notif.meta?.surveyId) {
                // Navigate internally uses rootPush if query params are complex, but for dictionary:
                rootPush(`/dashboard/${branchSlug ? branchSlug + '/' : ''}reports/${notif.meta.surveyId}?${query}`)
            } else {
                rootPush(`/dashboard/${branchSlug ? branchSlug + '/' : ''}reports?${query}`)
            }
        }

        setTimeout(() => setLoadingId(null), 1000)
    }

    // Polling Logic
    const fetchNotifications = async (isPolling = false) => {
        try {
            const queryParam = branchSlug ? `branchSlug=${branchSlug}&` : ''
            const res = await fetch(`/api/notifications?${queryParam}t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache' }
            })
            if (res.ok) {
                const data = await res.json()
                const newNotes = data.notifications as Notification[]

                // Check for New Notification
                if (isPolling && newNotes.length > 0) {
                    const latestId = newNotes[0].id
                    if (lastNotificationIdRef.current && latestId !== lastNotificationIdRef.current) {
                        const newNotif = newNotes[0]
                        if (!newNotif.isRead) {
                            playSound()
                            if (navigator.vibrate) navigator.vibrate([200, 100, 200])

                            toast(newNotif.title, {
                                description: newNotif.message,
                                icon: '🔔',
                                duration: 8000,
                                className: 'bg-[#1A1A1A] border border-white/10 text-white',
                                action: {
                                    label: 'Ver',
                                    onClick: () => handleNotificationClick(newNotif)
                                },
                                cancel: {
                                    label: 'Cerrar',
                                    onClick: () => { }
                                }
                            })
                        }
                    }
                }

                setNotifications(newNotes)
                setUnreadCount(data.unreadCount)
                if (newNotes.length > 0) {
                    lastNotificationIdRef.current = newNotes[0].id
                }
            }
        } catch (error) {
            console.error('Fetch error:', error)
        }
    }

    useEffect(() => {
        fetchNotifications(false)
        const interval = setInterval(() => fetchNotifications(true), 3000)
        return () => clearInterval(interval)
    }, [branchSlug])

    const markAsRead = async (id?: string) => {
        if (id) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        }

        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ notificationId: id, markAll: !id, branchSlug })
            })
        } catch (e) { console.error(e) }
    }

    const deleteRead = async () => {
        setNotifications(prev => prev.filter(n => !n.isRead))
        try {
            const queryParam = branchSlug ? `?branchSlug=${branchSlug}` : ''
            await fetch(`/api/notifications${queryParam}`, { method: 'DELETE' })
        } catch (e) { console.error(e) }
    }

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            deleteRead,
            testSound,
            loadingId,
            setLoadingId,
            requestPushPermission: askPermission
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotifications must be used within NotificationProvider')
    return context
}

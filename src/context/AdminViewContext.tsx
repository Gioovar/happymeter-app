'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminViewContextType {
    isSimulating: boolean
    realRole: string
    toggleSimulation: () => void
}

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined)

export function AdminViewProvider({
    children,
    initialIsSimulating,
    realRole
}: {
    children: React.ReactNode
    initialIsSimulating: boolean
    realRole: string
}) {
    const [isSimulating, setIsSimulating] = useState(initialIsSimulating)
    const router = useRouter()

    const toggleSimulation = () => {
        const newState = !isSimulating
        setIsSimulating(newState)
        // Set cookie
        document.cookie = `view_as_user=${newState}; path=/; max-age=31536000` // 1 year
        router.refresh()
    }

    return (
        <AdminViewContext.Provider value={{ isSimulating, realRole, toggleSimulation }}>
            {children}
        </AdminViewContext.Provider>
    )
}

export function useAdminView() {
    const context = useContext(AdminViewContext)
    if (context === undefined) {
        throw new Error('useAdminView must be used within an AdminViewProvider')
    }
    return context
}

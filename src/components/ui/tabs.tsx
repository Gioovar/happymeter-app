'use client'

import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
    activeTab: string
    setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType>({ activeTab: '', setActiveTab: () => { } })

interface TabsProps {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
    className?: string
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, value, onValueChange, children, className }) => {
    const [internalTab, setInternalTab] = useState(defaultValue || '')

    const isControlled = value !== undefined
    const activeTab = isControlled ? value : internalTab

    const handleTabChange = (newTab: string) => {
        if (!isControlled) {
            setInternalTab(newTab)
        }
        if (onValueChange) {
            onValueChange(newTab)
        }
    }

    return (
        <TabsContext.Provider value={{ activeTab: activeTab || '', setActiveTab: handleTabChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    )
}


export const TabsList: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("flex p-1 bg-black/20 rounded-lg", className)}>
        {children}
    </div>
)

export const TabsTrigger: React.FC<{ value: string, children: React.ReactNode, className?: string }> = ({ value, children, className }) => {
    const { activeTab, setActiveTab } = useContext(TabsContext)
    const isActive = activeTab === value

    return (
        <button
            onClick={() => setActiveTab(value)}
            className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                isActive
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                className
            )}
        >
            {children}
        </button>
    )
}

export const TabsContent: React.FC<{ value: string, children: React.ReactNode, className?: string }> = ({ value, children, className }) => {
    const { activeTab } = useContext(TabsContext)

    if (activeTab !== value) return null

    return (
        <div className={cn("animate-in fade-in slide-in-from-bottom-2 duration-200", className)}>
            {children}
        </div>
    )
}

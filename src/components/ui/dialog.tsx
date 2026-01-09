'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}

const DialogContext = createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => { } })

export const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
    // If controlled, use props, else internal state (simplified for this use case mostly controlled)
    const [isOpen, setIsOpen] = useState(open)

    useEffect(() => {
        setIsOpen(open)
    }, [open])

    const handleOpenChange = (newOpen: boolean) => {
        setIsOpen(newOpen)
        onOpenChange?.(newOpen)
    }

    return (
        <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

export const DialogContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    const { open, onOpenChange } = useContext(DialogContext)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={cn("relative bg-[#111] border border-white/10 rounded-xl w-full shadow-2xl animate-in zoom-in-95 duration-200", className)} onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                    <X className="w-4 h-4" />
                </button>
                {children}
            </div>
            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={() => onOpenChange(false)} />
        </div>
    )
}

export const DialogHeader: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("p-6 border-b border-white/10", className)}>
        {children}
    </div>
)

export const DialogTitle: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <h2 className={cn("text-xl font-bold text-white", className)}>
        {children}
    </h2>
)

export const DialogTrigger: React.FC<{ children: React.ReactNode, asChild?: boolean }> = ({ children, asChild }) => {
    const { onOpenChange } = useContext(DialogContext)

    // Minimal implementation: Clone element if asChild, else wrap in div
    // For simplicity with Radix-like API assume it receives an onClick

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                children.props.onClick?.(e)
                onOpenChange(true)
            }
        })
    }

    return (
        <div onClick={() => onOpenChange(true)} className="cursor-pointer">
            {children}
        </div>
    )
}

export const DialogDescription: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <p className={cn("text-gray-400 text-sm", className)}>
        {children}
    </p>
)

export const DialogFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("flex justify-end gap-2 mt-4", className)}>
        {children}
    </div>
)

export const DialogClose: React.FC<{ children: React.ReactNode, asChild?: boolean }> = ({ children, asChild }) => {
    const { onOpenChange } = useContext(DialogContext)

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                children.props.onClick?.(e)
                onOpenChange(false)
            }
        })
    }

    return (
        <button onClick={() => onOpenChange(false)}>
            {children}
        </button>
    )
}

'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { SalesContent } from './SalesContent'

interface SalesModalProps {
    trigger?: React.ReactNode
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    defaultPlan?: 'GROWTH' | 'POWER'
}

export default function SalesModal({ trigger, isOpen, onOpenChange, defaultPlan = 'GROWTH' }: SalesModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-[1000px] w-full bg-[#0a0a0a] border-white/10 p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <SalesContent defaultPlan={defaultPlan} showHeader={true} />
            </DialogContent>
        </Dialog>
    )
}

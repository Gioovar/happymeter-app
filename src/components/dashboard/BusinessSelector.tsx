'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { getRoleSummary } from '@/lib/rbac'

interface BusinessContext {
    id: string // Can be ownerId or just userId if self
    name: string
    role: string
    isActive: boolean
}

interface BusinessSelectorProps {
    contexts: BusinessContext[]
    activeContextId: string
}

export default function BusinessSelector({ contexts, activeContextId }: BusinessSelectorProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const activeContext = contexts.find(c => c.id === activeContextId) || contexts[0]

    // Fallback if no contexts
    if (!contexts || contexts.length <= 1) return null

    const handleSelect = (contextId: string) => {
        setOpen(false)
        if (contextId === activeContextId) return

        startTransition(() => {
            // Set cookie for active business context
            document.cookie = `happy_active_business=${contextId}; path=/; max-age=31536000; SameSite=Lax`

            // Force a full refresh to re-evaluate the layout with the new cookie
            window.location.href = '/dashboard'
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={isPending}
                    className="w-[200px] sm:w-[240px] justify-between bg-[#111] border-white/10 hover:bg-white/5 text-white h-10 px-3 rounded-xl pointer-events-auto"
                >
                    <div className="flex items-center gap-2 truncate">
                        {isPending ? (
                            <Loader2 className="h-4 w-4 text-violet-400 animate-spin flex-shrink-0" />
                        ) : (
                            <Store className="h-4 w-4 text-violet-400 flex-shrink-0" />
                        )}
                        <span className="truncate text-sm font-medium">
                            {activeContext?.name || "Seleccionar Negocio"}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] sm:w-[240px] p-0 bg-[#18181b] border-white/10 rounded-xl shadow-2xl z-50 pointer-events-auto">
                <Command className="bg-transparent">
                    <CommandInput placeholder="Buscar negocio..." className="text-white border-white/10" />
                    <CommandEmpty className="text-sm text-zinc-500 py-6 text-center">No se encontraron negocios.</CommandEmpty>
                    <CommandList>
                        <CommandGroup className="text-zinc-400">
                            {contexts.map((context) => (
                                <CommandItem
                                    key={context.id}
                                    value={context.name}
                                    onSelect={() => handleSelect(context.id)}
                                    className="text-white hover:bg-white/5 cursor-pointer py-3 rounded-lg flex items-start justify-between group"
                                >
                                    <div className="flex flex-col gap-1 pr-4">
                                        <span className={`font-medium text-sm transition-colors ${activeContextId === context.id ? 'text-violet-400' : 'text-zinc-200 group-hover:text-white'}`}>
                                            {context.name}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                                            {getRoleSummary(context.role as any)?.name || 'Propietario'}
                                        </span>
                                    </div>
                                    <Check
                                        className={`mr-2 h-4 w-4 flex-shrink-0 mt-0.5 ${activeContextId === context.id ? "opacity-100 text-violet-500" : "opacity-0"
                                            }`}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

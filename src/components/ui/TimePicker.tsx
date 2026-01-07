'use client';

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Parse current value
    const [currentHour, currentMinute] = value ? value.split(':') : ['', ''];

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); // 00, 05, 10...

    const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
        let newHour = currentHour || '12';
        let newMinute = currentMinute || '00';

        if (type === 'hour') newHour = val;
        if (type === 'minute') newMinute = val;

        onChange(`${newHour}:${newMinute}`);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "w-full bg-transparent border-b border-white/10 focus:border-cyan-500 py-1 text-white outline-none transition-colors text-left flex items-center gap-2",
                        !value && "text-gray-500",
                        className
                    )}
                >
                    {value || "--:--"}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 bg-[#1a1a1a] border-white/10 w-64" align="start">
                <div className="flex h-64">
                    {/* Hours Column */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide border-r border-white/5">
                        <div className="px-2 py-2 text-xs font-semibold text-gray-500 text-center sticky top-0 bg-[#1a1a1a] z-10 uppercase">
                            Horas
                        </div>
                        <div className="p-2 space-y-1">
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleTimeChange('hour', h)}
                                    className={cn(
                                        "w-full text-center py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5",
                                        currentHour === h ? "bg-cyan-600/20 text-cyan-400" : "text-gray-400"
                                    )}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minutes Column */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="px-2 py-2 text-xs font-semibold text-gray-500 text-center sticky top-0 bg-[#1a1a1a] z-10 uppercase">
                            Minutos
                        </div>
                        <div className="p-2 space-y-1">
                            {minutes.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleTimeChange('minute', m)}
                                    className={cn(
                                        "w-full text-center py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5",
                                        currentMinute === m ? "bg-cyan-600/20 text-cyan-400" : "text-gray-400"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

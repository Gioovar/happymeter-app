"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FaqItem {
    question: string;
    answer: string;
}

interface FaqAccordionProps {
    items: FaqItem[];
    category?: string;
}

export function FaqAccordion({ items, category }: FaqAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleItem = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full">
            {category && (
                <h3 className="mb-6 text-2xl font-bold tracking-tight text-white">{category}</h3>
            )}
            <div className="space-y-4">
                {items.map((item, index) => {
                    const isOpen = openIndex === index;

                    return (
                        <div
                            key={index}
                            className={cn(
                                "group border rounded-2xl overflow-hidden transition-all duration-300",
                                isOpen
                                    ? "border-fuchsia-500 bg-[#1A1F2E]/80 shadow-[0_0_20px_rgba(217,70,239,0.15)]"
                                    : "border-slate-800 bg-[#0F1420]/50 hover:border-slate-700 hover:bg-[#1A1F2E]/60"
                            )}
                        >
                            <button
                                onClick={() => toggleItem(index)}
                                className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-none"
                            >
                                <span className={cn(
                                    "text-[17px] font-semibold transition-colors",
                                    isOpen ? "text-white" : "text-slate-200 group-hover:text-white"
                                )}>
                                    {item.question}
                                </span>

                                <div className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                                    isOpen
                                        ? "bg-fuchsia-500/10 text-fuchsia-400"
                                        : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                                )}>
                                    <Plus
                                        className={cn(
                                            "h-5 w-5 transition-transform duration-300",
                                            isOpen && "rotate-45"
                                        )}
                                    />
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 text-slate-400 text-[16px] leading-relaxed whitespace-pre-line border-t border-white/5 mt-2 pt-4">
                                            {item.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

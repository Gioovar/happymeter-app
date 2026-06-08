'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center cursor-pointer"
            aria-label="Toggle Theme"
        >
            <div className="relative w-5 h-5 overflow-hidden">
                <motion.div
                    initial={false}
                    animate={{
                        y: theme === 'dark' ? 0 : 25,
                        opacity: theme === 'dark' ? 1 : 0,
                        scale: theme === 'dark' ? 1 : 0.5,
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="absolute inset-0 flex items-center justify-center text-yellow-500"
                >
                    <Sun className="w-5 h-5 fill-yellow-500/20" />
                </motion.div>
                <motion.div
                    initial={false}
                    animate={{
                        y: theme === 'light' ? 0 : -25,
                        opacity: theme === 'light' ? 1 : 0,
                        scale: theme === 'light' ? 1 : 0.5,
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="absolute inset-0 flex items-center justify-center text-indigo-600"
                >
                    <Moon className="w-5 h-5 fill-indigo-600/10" />
                </motion.div>
            </div>
        </button>
    );
}

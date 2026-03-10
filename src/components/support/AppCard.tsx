"use client";

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface AppCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  colorClass: string;
  delay?: number;
}

export function AppCard({ title, description, icon, colorClass, delay = 0 }: AppCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Card className="group flex flex-col h-full overflow-hidden border-slate-700/50 bg-[#1A1F2E]/60 backdrop-blur-xl transition-all hover:bg-[#1A1F2E] hover:border-slate-600 shadow-xl shadow-black/20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="pb-4">
          <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ${colorClass}`}>
            {icon}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <CardDescription className="text-lg text-slate-300 leading-relaxed flex-1">
            {description}
          </CardDescription>
          <div className="mt-6 flex items-center text-sm font-bold text-fuchsia-400 transition-all">
            <span className="flex items-center group-hover:text-white transition-colors">
              Explorar guías <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="group flex flex-col h-full overflow-hidden border-border/40 bg-background/60 backdrop-blur-xl transition-all hover:bg-background/80 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20">
        <CardHeader className="pb-4">
          <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-inner ${colorClass}`}>
            {icon}
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <CardDescription className="text-base text-muted-foreground/90 leading-relaxed flex-1">
            {description}
          </CardDescription>
          <div className="mt-6 flex items-center text-sm font-semibold text-primary transition-all">
            <span className="flex items-center group-hover:underline underline-offset-4">
              Explorar guías <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

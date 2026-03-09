import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface AppCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  colorClass: string;
}

export function AppCard({ title, description, icon, colorClass }: AppCardProps) {
  return (
    <Card className="group overflow-hidden border-border/50 bg-background/50 transition-all hover:bg-muted/50 hover:shadow-md">
      <CardHeader>
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${colorClass}`}>
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base h-24">
          {description}
        </CardDescription>
        <div className="mt-4 flex items-center text-sm font-medium text-primary">
          <span className="opacity-0 transition-opacity group-hover:opacity-100 flex items-center">
            Ver guías <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

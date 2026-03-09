import Link from 'next/link';
import { Layers } from 'lucide-react';

export function SupportHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-8 flex items-center space-x-2">
          <Link href="/support" className="flex items-center space-x-2">
            <Layers className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">Happy Support Center</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="/support/faq" className="transition-colors hover:text-foreground/80 text-foreground/60">FAQ</Link>
          <Link href="/support/contact" className="transition-colors hover:text-foreground/80 text-foreground/60">Contacto</Link>
          <Link href="/support/privacy" className="transition-colors hover:text-foreground/80 text-foreground/60">Privacidad</Link>
          <Link href="/support/terms" className="transition-colors hover:text-foreground/80 text-foreground/60">Términos</Link>
        </nav>
      </div>
    </header>
  );
}

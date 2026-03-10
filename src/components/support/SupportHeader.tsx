import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export function SupportHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="container flex h-20 items-center justify-between px-4 sm:px-6 mx-auto">
        <Link href="/" className="flex items-center">
          <BrandLogo size="md" variant="light" />
        </Link>

        {/* Nav links Pill */}
        <nav className="hidden lg:flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm font-medium">
          <Link href="/pricing" className="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors">Precios</Link>
          <Link href="/blog" className="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5">
            Blog <span className="bg-fuchsia-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">NEW</span>
          </Link>
          <Link href="/tutorials" className="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors">Tutoriales</Link>
          <Link href="/join" className="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5">
            Únete <span className="bg-fuchsia-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">NEW</span>
          </Link>
          <Link href="/support" className="px-3 py-1.5 rounded-full text-white bg-white/10 transition-colors">Ayuda</Link>
        </nav>

        {/* Iniciar sesión */}
        <Link href="/login" className="flex items-center gap-2 bg-black border border-fuchsia-500/40 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:bg-white/5 transition-all shadow-[0_0_20px_rgba(217,70,239,0.2)] hover:shadow-[0_0_25px_rgba(217,70,239,0.4)] hover:border-fuchsia-400">
          <Sparkles className="h-4 w-4 text-fuchsia-400" /> Iniciar sesión
        </Link>
      </div>
    </header>
  );
}

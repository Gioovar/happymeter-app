import React, { useState } from 'react'
import { Menu, X, Home, LayoutDashboard, Users, Settings, MessageSquare, Sparkles, Store } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SidebarProps {
  businessName?: string;
  role?: string;
  plan?: string;
  activeItem?: string;
  onNavigate?: (href: string) => void;
}

const navItems = [
  { title: "Inicio", href: "#home", icon: Home },
  { title: "Métricas", href: "#metrics", icon: LayoutDashboard },
  { title: "Feedback", href: "#feedback", icon: MessageSquare },
  { title: "Equipo", href: "#team", icon: Users },
  { title: "Ajustes", href: "#settings", icon: Settings },
];

export function Sidebar({
  businessName = "Mi Negocio",
  role = "Administrador",
  plan = "PRO",
  activeItem = "#home",
  onNavigate = () => {}
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
             </div>
             <span className="text-white font-bold text-xl tracking-tight">HappyMeter</span>
          </div>
          <div className="mt-1.5 flex flex-col items-start gap-1">
             <span className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-violet-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-500/30 max-w-[200px] truncate shadow-sm uppercase tracking-wider">
                 {businessName}
             </span>
             <p className="text-[11px] text-gray-400 font-medium tracking-wide">
                 {role} ({plan})
             </p>
          </div>
        </div>
        <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-white">
           <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
         {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.href;
            return (
              <button
                key={item.title}
                onClick={() => onNavigate(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.title}</span>
              </button>
            )
         })}
      </nav>

      <div className="px-4 pb-4">
        <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md hover:shadow-amber-600/20 transition-all group text-left"
        >
            <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
                <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Negocios</span>
                <span className="text-xs font-bold leading-tight">Mis Sucursales</span>
            </div>
        </button>
      </div>

      <div className="p-4 border-t border-white/10 bg-[#111]">
          <div className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                 UD
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Usuario Demo</p>
                <p className="text-xs text-gray-400 truncate">usuario@ejemplo.com</p>
             </div>
          </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-40">
        <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
           </div>
           <span className="font-bold text-white tracking-tight">HappyMeter</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 bg-[#111] border-r border-white/10 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
                <SidebarContent />
            </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-white/10 flex-col h-screen sticky top-0 hidden md:flex z-50">
          <SidebarContent />
      </aside>
    </>
  )
}

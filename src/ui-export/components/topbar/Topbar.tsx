import React from 'react';
import { Bell, Search, Moon } from 'lucide-react';

export interface TopbarProps {
  userName?: string;
  userInitials?: string;
  onNotificationClick?: () => void;
}

export function Topbar({
  userName = "Usuario Demo",
  userInitials = "UD",
  onNotificationClick = () => {}
}: TopbarProps) {
  return (
    <div className="hidden md:flex justify-between items-center p-4 absolute top-0 right-0 z-30 w-full md:w-[calc(100%-16rem)] pointer-events-none">
        
        {/* Left section items */}
        <div className="pointer-events-auto pl-4">
            <button className="p-2.5 rounded-xl bg-[#111] border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all shadow-lg">
                <Moon className="w-5 h-5" />
            </button>
        </div>

        {/* Right section items */}
        <div className="pointer-events-auto flex items-center gap-4">
            {/* Search Input */}
            <div className="relative w-64 hidden lg:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                   type="text" 
                   placeholder="Buscar sucursales, reportes..." 
                   className="w-full bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors shadow-lg"
                />
            </div>

            {/* Notification Bell */}
            <button 
              onClick={onNotificationClick}
              className="p-2.5 rounded-xl bg-[#111] border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all shadow-lg relative"
            >
                <Bell className="w-5 h-5" />
                {/* Notification Badge indicator */}
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#111] animate-pulse"></span>
            </button>

            {/* User Profile Hook */}
            <div className="bg-[#111] border border-white/10 rounded-full p-1.5 flex items-center gap-3 shadow-xl cursor-pointer hover:border-white/20 transition-colors">
                <div className="text-right hidden lg:block pl-3">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Conectado como</p>
                    <p className="text-sm text-white font-bold leading-tight">{userName}</p>
                </div>
                <div className="flex flex-row-reverse border-2 border-[#1a1a1a] rounded-full overflow-hidden w-9 h-9">
                    <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-xs">
                        {userInitials}
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

import React from 'react';
import { Sidebar, SidebarProps } from '../components/sidebar/Sidebar';
import { Topbar, TopbarProps } from '../components/topbar/Topbar';

export interface AppLayoutProps {
    children: React.ReactNode;
    sidebarProps?: SidebarProps;
    topbarProps?: TopbarProps;
}

export function AppLayout({ children, sidebarProps, topbarProps }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            {/* Sidebar section */}
            <Sidebar {...sidebarProps} />

            <main className="flex-1 overflow-y-auto h-screen relative">
                {/* Topbar section */}
                <Topbar {...topbarProps} />

                {/* Main Content Area */}
                <div className="pt-20 md:pt-24 px-4 md:px-8 pb-10 w-full max-w-7xl mx-auto h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}

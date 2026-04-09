import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { esES } from '@clerk/localizations'
import { Toaster } from 'sonner'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./main.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'),
  title: "HappyMeter | Medición de Satisfacción con IA",
  description: "La plataforma definitiva para gestionar encuestas de satisfacción, lealtad de clientes y métricas de felicidad en tiempo real.",
  themeColor: "#8b5cf6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HappyMeter",
  },
  icons: {
    icon: "/happymeter_logo.png", // Fallback to existing logo
    apple: "/happymeter_logo.png",
  },
  openGraph: {
    images: '/og-image.png', // Assuming you might have one or will want one
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={esES}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ffffff', // Minimalist White for primary interactions
          colorBackground: '#111111',
          colorText: 'white',
          colorInputBackground: '#1a1a1a',
          colorInputText: 'white',
        },
        elements: {
          card: "bg-[#111] border border-white/10 shadow-xl",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
          socialButtonsBlockButtonText: "text-white",
          formButtonPrimary: "bg-white text-black hover:bg-gray-200", // Explicit B&W button
          footerActionText: "text-gray-400",
          footerActionLink: "text-white hover:text-gray-300 decoration-white/30", // White links instead of violet
          formFieldLabel: "text-gray-300",
          formFieldInput: "bg-black/50 border-white/10 text-white focus:border-white transition-colors",

          // User Profile Specifics
          profileSectionTitle: "text-white font-bold",
          profileSectionTitleText: "text-white",
          badge: "bg-white/10 text-white",

          // Navigation
          navbarButton: "text-gray-400 hover:text-white",
          navbarButtonIcon: "text-gray-400 group-hover:text-white",

          // Danger
          formButtonReset: "text-white hover:bg-white/5",
          fileDropAreaWithChild: "bg-black/50 border-white/10"
        }
      }}
    >
      <html lang="es" suppressHydrationWarning className="bg-[#0a0a0a]">
        <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen`}>
          {children}
          <Toaster 
            position="top-center" 
            theme="dark" 
            richColors 
            closeButton 
            toastOptions={{
              className: "font-sans border border-white/10 shadow-2xl backdrop-blur-xl bg-black/80 rounded-2xl p-4 gap-3 items-start",
              classNames: {
                toast: "group-[.toaster]:bg-black/90 group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl",
                title: "text-base font-semibold group-[.toaster]:text-white",
                description: "text-sm group-[.toaster]:text-gray-400 mt-1",
                actionButton: "bg-white text-black font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors",
                cancelButton: "bg-white/10 text-white font-medium px-4 py-2 rounded-lg hover:bg-white/20 transition-colors",
                success: "group-[.toaster]:bg-[#031d10] group-[.toaster]:border-green-500/30 group-[.toaster]:text-green-500",
                error: "group-[.toaster]:bg-[#1d0303] group-[.toaster]:border-red-500/30 group-[.toaster]:text-red-500",
                info: "group-[.toaster]:bg-[#03131d] group-[.toaster]:border-blue-500/30 group-[.toaster]:text-blue-500",
                warning: "group-[.toaster]:bg-[#1d1503] group-[.toaster]:border-yellow-500/30 group-[.toaster]:text-yellow-500",
              }
            }}
          />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
  // Forced rebuild
}

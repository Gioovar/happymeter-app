import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { esES } from '@clerk/localizations'
import { Toaster } from 'sonner'
import { Analytics } from "@vercel/analytics/react"
import "./main.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'),
  title: "HappyMeter | Medición de Satisfacción con IA",
  description: "La plataforma definitiva para gestionar encuestas de satisfacción, lealtad de clientes y métricas de felicidad en tiempo real.",
  manifest: "/manifest.json",
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
      <html lang="es" suppressHydrationWarning>
        <body className={inter.className}>
          {children}
          <Toaster position="top-center" richColors />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
  // Forced rebuild
}

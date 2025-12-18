import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { esES } from '@clerk/localizations'
import { Toaster } from 'sonner'
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HappyMeter | Medición de Satisfacción con IA",
  description: "La plataforma definitiva para gestionar encuestas de satisfacción, lealtad de clientes y métricas de felicidad en tiempo real.",
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
          colorPrimary: '#8b5cf6',
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
          footerActionText: "text-gray-400",
          footerActionLink: "text-violet-400 hover:text-violet-300",
          formFieldLabel: "text-gray-300",
          formFieldInput: "bg-black/50 border-white/10 text-white focus:border-violet-500 transition-colors"
        }
      }}
    >
      <html lang="es" suppressHydrationWarning>
        <body className={inter.className}>
          {children}
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}

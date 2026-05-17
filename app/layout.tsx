import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/auth/context"
import { LanguageProvider } from "@/lib/i18n/context"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "SSO System - Secure Authentication",
  description: "Production-ready Single Sign-On system with multiple OAuth providers",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${jetbrainsMono.variable}`}>
        <LanguageProvider>
          <AuthProvider>
            <Suspense fallback={null}>{children}</Suspense>
          </AuthProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}

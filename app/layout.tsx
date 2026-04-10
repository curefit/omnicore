import type { Metadata } from "next"
import { Inter, Roboto, DM_Mono, Space_Grotesk } from "next/font/google"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { GlobalThemeToggle } from "@/components/theme/GlobalThemeToggle"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata: Metadata = {
  title: "OmniCore — Gym Facility Management",
  description:
    "Multi-role B2B SaaS portal for managing community gym facilities in RWAs and corporate campuses.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${roboto.variable} ${dmMono.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          {children}
          <GlobalThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  )
}

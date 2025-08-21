import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: "Aztec PFP Generator - Customize Your Profile",
  description:
    "Create custom Aztec-themed profile pictures. Upload your photo and add stickers to show your support for privacy and the Aztec Network community.",
  icons: {
    icon: "/aztec-pfp.png",
    shortcut: "/aztec-pfp.png",
    apple: "/aztec-pfp.png",
  },
  openGraph: {
    title: "Aztec PFP Generator",
    description: "Customize your profile picture with Aztec-themed stickers",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}

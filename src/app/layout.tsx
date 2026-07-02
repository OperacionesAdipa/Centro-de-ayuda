import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { WhatsAppButton } from '@/components/WhatsAppButton'

export const metadata: Metadata = {
  title: 'Centro de Ayuda ADIPA',
  description: 'Encuentra respuestas a tus preguntas sobre ADIPA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  )
}

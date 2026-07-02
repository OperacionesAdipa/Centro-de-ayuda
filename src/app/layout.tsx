import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Centro de Ayuda ADIPA',
  description: 'Encuentra respuestas a tus preguntas sobre ADIPA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
  const isAgentRoute = pathname.startsWith('/agentes') || pathname.startsWith('/acceso')

  return (
    <html lang="es">
      <body>
        {!isAgentRoute && <Navbar />}
        {children}
        {!isAgentRoute && <WhatsAppButton />}
      </body>
    </html>
  )
}

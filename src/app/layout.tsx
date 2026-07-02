import type { Metadata } from 'next'
import './globals.css'
import { ConditionalNav } from '@/components/ConditionalNav'

export const metadata: Metadata = {
  title: 'Centro de Ayuda ADIPA',
  description: 'Encuentra respuestas a tus preguntas sobre ADIPA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ConditionalNav />
        {children}
      </body>
    </html>
  )
}

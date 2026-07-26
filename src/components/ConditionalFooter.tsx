'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './Footer'

export function ConditionalFooter() {
  const pathname = usePathname()
  const isAgentRoute = pathname.startsWith('/agentes') || pathname.startsWith('/acceso')
  if (isAgentRoute) return null
  return <Footer />
}

'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { WhatsAppButton } from './WhatsAppButton'

export function ConditionalNav() {
  const pathname = usePathname()
  const isAgentRoute = pathname.startsWith('/agentes') || pathname.startsWith('/acceso')

  if (isAgentRoute) return null

  return (
    <>
      <Navbar />
      <WhatsAppButton />
    </>
  )
}

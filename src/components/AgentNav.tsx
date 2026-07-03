'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export function AgentNav() {
  const pathname = usePathname()
  const router = useRouter()

  function logout() {
    localStorage.removeItem('agent_token')
    router.push('/acceso')
  }

  const links = [
    { href: '/agentes', label: 'Portal', exact: true },
    { href: '/agentes/ia', label: 'Centro IA' },
    { href: '/agentes/nuevo', label: '+ Nuevo' },
  ]

  return (
    <div className="agent-header">
      <div className="agent-header-left">
        <button
          onClick={() => router.back()}
          className="agent-nav-btn"
          title="Volver atras"
        >
          &#8592; Volver
        </button>
        <Link href="/agentes">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 28, marginLeft: 8 }} />
        </Link>
        <span className="agent-header-title">Modo edicion</span>
      </div>
      <nav className="agent-nav-links">
        {links.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`agent-nav-btn ${isActive ? 'active' : ''}`}>
              {label}
            </Link>
          )
        })}
        <Link href="/" target="_blank" className="agent-nav-btn">
          Ver sitio
        </Link>
        <button className="agent-nav-btn" onClick={logout}>
          Cerrar sesion
        </button>
      </nav>
    </div>
  )
}

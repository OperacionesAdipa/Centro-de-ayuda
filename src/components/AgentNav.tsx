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
    { href: '/agentes', label: '📋 Portal', exact: true },
    { href: '/agentes/ia', label: '🤖 IA' },
    { href: '/agentes/nuevo', label: '+ Nuevo artículo' },
  ]

  return (
    <div className="agent-header">
      <div className="agent-header-left">
        <Link href="/agentes">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 28 }} />
        </Link>
        <span className="agent-header-title">&#9998; Modo edición</span>
      </div>
      <nav className="agent-nav-links">
        {links.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`agent-nav-btn ${isActive ? 'active' : ''}`}
            >
              {label}
            </Link>
          )
        })}
        
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="agent-nav-btn"
        >
          &#128065; Ver sitio
        </a>
        <button className="agent-nav-btn" onClick={logout}>
          Cerrar sesión
        </button>
      </nav>
    </div>
  )
}

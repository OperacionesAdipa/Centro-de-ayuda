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

  function goBack() {
    const returnUrl = localStorage.getItem('agent_return_url')
    if (returnUrl) {
      localStorage.removeItem('agent_return_url')
      router.push(returnUrl)
    } else {
      router.back()
    }
  }

const links = [
  { href: '/agentes', label: '📋 Todos los artículos', exact: true },
  { href: '/agentes/categorias', label: '🗂️ Categorías' },
  { href: '/agentes/ia', label: '✨ Generar con IA' },
  { href: '/agentes/nuevo', label: '✏️ Nuevo artículo' },
  { href: '/agentes/estadisticas', label: '📊 Estadísticas' },
]

  return (
    <div style={{
      background: '#fff',
      borderBottom: '0.5px solid var(--border)',
      padding: '0 24px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={goBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 99,
            border: '0.5px solid var(--border)',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--muted)',
            transition: 'all 0.15s',
          }}
        >
          ← Volver
        </button>
        <Link href="/agentes">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 26, display: 'block' }} />
        </Link>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--purple)',
          background: 'var(--lp)',
          padding: '3px 10px',
          borderRadius: 99,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Portal agentes
        </div>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {links.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 99,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s',
                background: isActive ? 'var(--purple)' : '#fff',
                color: isActive ? '#fff' : 'var(--dark)',
                border: isActive ? '0.5px solid var(--purple)' : '0.5px solid var(--border)',
              }}
            >
              {label}
            </Link>
          )
        })}

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

        <Link
          href="/"
          target="_blank"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 99,
            fontSize: 13,
            textDecoration: 'none',
            color: 'var(--purple)',
            border: '0.5px solid rgba(112,78,253,0.25)',
            background: 'var(--lp)',
            transition: 'all 0.15s',
          }}
        >
          👁 Vista estudiante
        </Link>

        <button
          onClick={logout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 99,
            fontSize: 13,
            cursor: 'pointer',
            color: '#e24b4a',
            border: '0.5px solid rgba(226,75,74,0.25)',
            background: '#fff',
            transition: 'all 0.15s',
          }}
        >
          Cerrar sesión
        </button>
      </nav>
    </div>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useProfileContext } from '../../context/ProfileContext'
import './Topbar.css'

interface TopbarProps {
  actions?: React.ReactNode
}

export function Topbar({ actions }: TopbarProps) {
  const { pathname } = useLocation()
  const { profile } = useProfileContext()
  const initial = (profile?.name ?? 'T').charAt(0).toUpperCase()

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <span className="topbar-logo-clip">
          <img src="/logo.svg" className="topbar-logo" alt="The Worksheet Project" />
        </span>
      </Link>

      {profile && pathname !== '/editor' && (
        <nav className="topbar-nav">
          {profile?.is_admin && (
            <Link className={`topbar-nav-link${pathname.startsWith('/schemes') ? ' topbar-nav-link--active' : ''}`} to="/schemes">
              Schemes
            </Link>
          )}
          <Link className={`topbar-nav-link${pathname === '/gallery' ? ' topbar-nav-link--active' : ''}`} to="/gallery">
            My Worksheets
          </Link>
          <Link className={`topbar-nav-link${pathname === '/insights' ? ' topbar-nav-link--active' : ''}`} to="/insights">
            Insights
          </Link>
          <Link className={`topbar-nav-link${pathname === '/booklet' ? ' topbar-nav-link--active' : ''}`} to="/booklet">
            Booklet
          </Link>
          <Link className={`topbar-nav-link${pathname === '/library' ? ' topbar-nav-link--active' : ''}`} to="/library">
            Public Library
          </Link>
          <Link className={`topbar-nav-link${pathname === '/follow-ups' ? ' topbar-nav-link--active' : ''}`} to="/follow-ups">
            Follow ups
          </Link>
          {profile?.is_admin && (
            <Link className={`topbar-nav-link${pathname === '/oak' ? ' topbar-nav-link--active' : ''}`} to="/oak">
              Oak
            </Link>
          )}
          {profile?.is_admin && (
            <Link className={`topbar-nav-link topbar-nav-link--admin${pathname === '/admin' ? ' topbar-nav-link--active' : ''}`} to="/admin">
              Admin
            </Link>
          )}
        </nav>
      )}

      <div className="topbar-right">
        {actions && <div className="topbar-actions">{actions}</div>}
        {profile && (
          <Link
            to="/profile"
            className={`topbar-avatar${pathname === '/profile' ? ' topbar-avatar--active' : ''}`}
            title="Your profile"
          >
            {initial}
          </Link>
        )}
      </div>
    </header>
  )
}

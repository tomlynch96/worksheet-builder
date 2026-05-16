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
      <Link to="/" className="topbar-brand">Worksheet Builder</Link>

      {pathname !== '/editor' && (
        <nav className="topbar-nav">
          <Link className={`topbar-nav-link${pathname === '/gallery' ? ' topbar-nav-link--active' : ''}`} to="/gallery">
            My Worksheets
          </Link>
          <Link className={`topbar-nav-link${pathname === '/insights' ? ' topbar-nav-link--active' : ''}`} to="/insights">
            Insights
          </Link>
        </nav>
      )}

      {actions && <div className="topbar-actions">{actions}</div>}

      <Link
        to="/profile"
        className={`topbar-avatar${pathname === '/profile' ? ' topbar-avatar--active' : ''}`}
        title="Your profile"
      >
        {initial}
      </Link>
    </header>
  )
}

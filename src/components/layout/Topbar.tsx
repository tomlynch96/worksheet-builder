import { Link, useLocation } from 'react-router-dom'
import './Topbar.css'

interface TopbarProps {
  actions?: React.ReactNode
}

export function Topbar({ actions }: TopbarProps) {
  const { pathname } = useLocation()

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">Worksheet Builder</Link>

      <nav className="topbar-nav">
        <Link className={`topbar-nav-link${pathname === '/' ? ' topbar-nav-link--active' : ''}`} to="/">
          Home
        </Link>
        <Link className={`topbar-nav-link${pathname === '/gallery' ? ' topbar-nav-link--active' : ''}`} to="/gallery">
          My Worksheets
        </Link>
      </nav>

      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  )
}

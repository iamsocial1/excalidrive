import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LeftPanel.css'

interface LeftPanelProps {
  isCollapsed: boolean
  onToggle: () => void
}

export const LeftPanel = ({ isCollapsed, onToggle }: LeftPanelProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signout } = useAuth()

  const handleSignOut = async () => {
    try {
      await signout()
      navigate('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const isActive = (path: string) => {
    return location.pathname.includes(path)
  }

  return (
    <aside className={`left-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={onToggle} aria-label="Toggle panel">
        {isCollapsed ? '→' : '←'}
      </button>

      {!isCollapsed && (
        <nav className="panel-nav">
          <button
            className="nav-item back-to-canvas"
            onClick={() => navigate('/')}
          >
            <span className="nav-icon">✏️</span>
            <span className="nav-label">Back to Canvas</span>
          </button>

          <div className="nav-separator"></div>

          <button
            className={`nav-item ${isActive('/browser/recent') ? 'active' : ''}`}
            onClick={() => navigate('/browser/recent')}
          >
            <span className="nav-icon">🕒</span>
            <span className="nav-label">Recent</span>
          </button>

          <button
            className={`nav-item ${isActive('/browser/projects') ? 'active' : ''}`}
            onClick={() => navigate('/browser/projects')}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-label">Projects</span>
          </button>

          <button
            className={`nav-item ${isActive('/browser/settings') ? 'active' : ''}`}
            onClick={() => navigate('/browser/settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>

          <div className="panel-spacer"></div>

          <button className="nav-item sign-out" onClick={handleSignOut}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Sign Out</span>
          </button>
        </nav>
      )}
    </aside>
  )
}

import { useAuth } from '../contexts/AuthContext'
import './ViewModeToggle.css'

export interface ViewModeToggleProps {
  viewMode: 'list' | 'icon'
  onViewModeChange: (mode: 'list' | 'icon') => void
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  const { updateUser, user } = useAuth()

  const handleViewModeChange = async (mode: 'list' | 'icon') => {
    // Update local state immediately for responsive UI
    onViewModeChange(mode)

    // Persist to backend if user is authenticated
    if (user) {
      try {
        await updateUser({
          preferences: {
            defaultViewMode: mode,
          },
        })
      } catch (error) {
        console.error('Failed to save view mode preference:', error)
        // Note: We don't revert the local state since the user can still use the view mode
        // The preference just won't be persisted across sessions
      }
    }
  }

  return (
    <div className="view-mode-toggle">
      <button
        className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('list')}
        title="List view"
        aria-label="List view"
      >
        ☰
      </button>
      <button
        className={`view-mode-button ${viewMode === 'icon' ? 'active' : ''}`}
        onClick={() => handleViewModeChange('icon')}
        title="Icon view"
        aria-label="Icon view"
      >
        ⊞
      </button>
    </div>
  )
}

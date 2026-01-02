import { MainMenu } from '@excalidraw/excalidraw'
import { useAuth } from '../contexts/AuthContext'
import './CustomExcalidrawMenu.css'

interface CustomExcalidrawMenuProps {
  onSignupClick: () => void
  onSigninClick: () => void
  onBrowseFilesClick: () => void
  onSaveClick: () => void
}

export function CustomExcalidrawMenu({
  onSignupClick,
  onSigninClick,
  onBrowseFilesClick,
  onSaveClick,
}: CustomExcalidrawMenuProps) {
  const { isAuthenticated } = useAuth()

  return (
    <MainMenu>
      <MainMenu.DefaultItems.LoadScene />
      
      {/* Custom Save Item */}
      <MainMenu.Item onSelect={onSaveClick}>
        <div className="custom-menu-item">
          <span className="custom-menu-item-icon">💾</span>
          <span className="custom-menu-item-text">Save Drawing</span>
        </div>
      </MainMenu.Item>
      
      <MainMenu.DefaultItems.SaveToActiveFile />
      <MainMenu.DefaultItems.Export />
      <MainMenu.DefaultItems.SaveAsImage />
      
      <MainMenu.Separator />
      
      {!isAuthenticated ? (
        <>
          <MainMenu.Item onSelect={onSignupClick}>
            <div className="custom-menu-item">
              <span className="custom-menu-item-icon">👤</span>
              <span className="custom-menu-item-text">Sign Up</span>
            </div>
          </MainMenu.Item>
          <MainMenu.Item onSelect={onSigninClick}>
            <div className="custom-menu-item">
              <span className="custom-menu-item-icon">🔑</span>
              <span className="custom-menu-item-text">Sign In</span>
            </div>
          </MainMenu.Item>
        </>
      ) : (
        <MainMenu.Item onSelect={onBrowseFilesClick}>
          <div className="custom-menu-item">
            <span className="custom-menu-item-icon">📁</span>
            <span className="custom-menu-item-text">Browse Files</span>
          </div>
        </MainMenu.Item>
      )}
      
      <MainMenu.Separator />
      
      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.DefaultItems.ToggleTheme />
      <MainMenu.DefaultItems.ChangeCanvasBackground />
    </MainMenu>
  )
}

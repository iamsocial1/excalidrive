import './DrawingHeader.css'

export interface DrawingHeaderProps {
  drawingName: string | null
  projectName: string | null
  isAuthenticated: boolean
}

export function DrawingHeader({ drawingName, projectName, isAuthenticated }: DrawingHeaderProps) {
  // Only render component when user is authenticated
  if (!isAuthenticated) {
    return null
  }

  // Show "Untitled" when drawingName is null or empty
  const displayName = drawingName && drawingName.trim() !== '' ? drawingName : 'Untitled'

  return (
    <div className="drawing-header">
      <div className="drawing-header-name">{displayName}</div>
      {projectName && <div className="drawing-header-project">{projectName}</div>}
    </div>
  )
}

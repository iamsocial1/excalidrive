import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectService } from '../services/project.service'
import { drawingService } from '../services/drawing.service'
import type { Project } from '../types/project.types'
import type { Drawing } from '../types/drawing.types'
import { DrawingCard } from './DrawingCard'
import { ViewModeToggle } from './ViewModeToggle'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorState } from './ErrorState'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../utils/toast'
import './ProjectDetailView.css'

type ViewMode = 'list' | 'icon'

export const ProjectDetailView = () => {
  const { user } = useAuth()
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load from user preferences if authenticated, otherwise default to 'list'
    return user?.preferences?.defaultViewMode || 'list'
  })

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  // Update view mode when user preferences change
  useEffect(() => {
    if (user?.preferences?.defaultViewMode) {
      setViewMode(user.preferences.defaultViewMode)
    }
  }, [user?.preferences?.defaultViewMode])

  const loadProjectData = async (append: boolean = false) => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)
      
      const offset = append ? drawings.length : 0
      
      if (!append) {
        // Load project data on initial load
        const [projectData, drawingsResult] = await Promise.all([
          projectService.getProject(projectId),
          drawingService.getDrawingsByProject(projectId, 50, offset),
        ])
        setProject(projectData)
        setDrawings(drawingsResult.drawings)
        setHasMore(drawingsResult.hasMore)
      } else {
        // Load more drawings
        const drawingsResult = await drawingService.getDrawingsByProject(projectId, 50, offset)
        setDrawings((prev) => [...prev, ...drawingsResult.drawings])
        setHasMore(drawingsResult.hasMore)
      }
    } catch (err) {
      console.error('Failed to load project data:', err)
      setError('Failed to load project. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const loadMore = () => {
    if (!loading && hasMore) {
      loadProjectData(true)
    }
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const handleDrawingClick = (drawingId: string) => {
    navigate(`/?drawingId=${drawingId}`)
  }

  const handleRename = async (drawingId: string, newName: string) => {
    try {
      await drawingService.updateDrawing(drawingId, { name: newName })
      setDrawings((prev) =>
        prev.map((d) => (d.id === drawingId ? { ...d, name: newName } : d))
      )
    } catch (err) {
      console.error('Failed to rename drawing:', err)
      toast.error('Failed to rename drawing. Please try again.')
    }
  }

  const handleDelete = async (drawingId: string) => {
    try {
      await drawingService.deleteDrawing(drawingId)
      setDrawings((prev) => prev.filter((d) => d.id !== drawingId))
      // Update project drawing count
      if (project) {
        setProject({ ...project, drawingCount: project.drawingCount - 1 })
      }
      toast.success('Drawing deleted successfully')
    } catch (err) {
      console.error('Failed to delete drawing:', err)
      toast.error('Failed to delete drawing. Please try again.')
    }
  }

  const handleShare = async (drawingId: string) => {
    try {
      const shareUrl = await drawingService.createPublicLink(drawingId)
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to create share link:', err)
      toast.error('Failed to create share link. Please try again.')
    }
  }

  const handleMove = (drawingId: string, _targetProjectId: string) => {
    // Remove the drawing from the current project view after successful move
    setDrawings((prev) => prev.filter((d) => d.id !== drawingId))
    // Update project drawing count
    if (project) {
      setProject({ ...project, drawingCount: project.drawingCount - 1 })
    }
  }

  const handleBackToProjects = () => {
    navigate('/browser/projects')
  }

  if (loading) {
    return (
      <div className="project-detail-view">
        <LoadingSpinner message="Loading project..." />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="project-detail-view">
        <ErrorState 
          message={error || 'Project not found'} 
          onRetry={loadProjectData}
        />
      </div>
    )
  }

  return (
    <div className="project-detail-view">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={handleBackToProjects}>
          Projects
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{project.name}</span>
      </div>

      <div className="project-detail-header">
        <div className="header-left">
          <h2>{project.name}</h2>
          <p className="drawing-count">
            {drawings.length} {drawings.length === 1 ? 'drawing' : 'drawings'}
          </p>
        </div>
        <div className="header-actions">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        </div>
      </div>

      {drawings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎨</div>
          <h3>No drawings yet</h3>
          <p>Create a drawing and save it to this project</p>
          <button className="create-button" onClick={() => navigate('/')}>
            Create Drawing
          </button>
        </div>
      ) : (
        <div className="drawings-display">
          {viewMode === 'list' && (
            <div className="list-header">
              <div className="list-header-thumbnail"></div>
              <div className="list-header-name">Name</div>
              <div className="list-header-date">Last Modified</div>
              <div className="list-header-actions">Actions</div>
            </div>
          )}

          <div className="drawings-container">
            {viewMode === 'icon' ? (
              <div className="icon-grid">
                {drawings.map((drawing) => (
                  <DrawingCard
                    key={drawing.id}
                    drawing={drawing}
                    viewMode="icon"
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onShare={handleShare}
                    onMove={handleMove}
                    onClick={handleDrawingClick}
                  />
                ))}
              </div>
            ) : (
              <div className="list-container">
                {drawings.map((drawing) => (
                  <DrawingCard
                    key={drawing.id}
                    drawing={drawing}
                    viewMode="list"
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onShare={handleShare}
                    onMove={handleMove}
                    onClick={handleDrawingClick}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="load-more-container">
              <button 
                className="load-more-button" 
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

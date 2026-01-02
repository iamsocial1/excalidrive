import { useState, useEffect } from 'react'
import { projectService } from '../services/project.service'
import type { Project } from '../types/project.types'
import './MoveDrawingModal.css'

export interface MoveDrawingModalProps {
  isOpen: boolean
  drawingName: string
  currentProjectId: string
  onClose: () => void
  onMove: (targetProjectId: string) => Promise<void>
}

export const MoveDrawingModal = ({
  isOpen,
  drawingName,
  currentProjectId,
  onClose,
  onMove,
}: MoveDrawingModalProps) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectService.getProjects()
      // Filter out the current project
      const availableProjects = response.projects.filter(
        (project: Project) => project.id !== currentProjectId
      )
      setProjects(availableProjects)
      
      // Set first project as default selection if available
      if (availableProjects.length > 0) {
        setSelectedProjectId(availableProjects[0].id)
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async () => {
    if (!selectedProjectId) {
      setError('Please select a project')
      return
    }

    try {
      setIsMoving(true)
      setError(null)
      await onMove(selectedProjectId)
      onClose()
    } catch (err) {
      console.error('Failed to move drawing:', err)
      setError('Failed to move drawing. Please try again.')
    } finally {
      setIsMoving(false)
    }
  }

  const handleCancel = () => {
    if (!isMoving) {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isMoving) {
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content move-drawing-modal">
        <div className="modal-header">
          <h2>Move Drawing</h2>
          <button
            className="modal-close"
            onClick={handleCancel}
            disabled={isMoving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="drawing-name-label">
            Moving: <strong>{drawingName}</strong>
          </p>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading projects...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadProjects} className="retry-button">
                Retry
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>No other projects available.</p>
              <p className="help-text">
                Create a new project first to move this drawing.
              </p>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="project-select">Select destination project:</label>
              <select
                id="project-select"
                className="project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={isMoving}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.drawingCount}{' '}
                    {project.drawingCount === 1 ? 'drawing' : 'drawings'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="button button-secondary"
            onClick={handleCancel}
            disabled={isMoving}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={handleMove}
            disabled={isMoving || loading || projects.length === 0}
          >
            {isMoving ? 'Moving...' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  )
}

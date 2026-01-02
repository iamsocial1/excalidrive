import { useState, useEffect, useRef } from 'react'
import { projectService } from '../services/project.service'
import type { Project } from '../types/project.types'
import { toast } from '../utils/toast'
import { LoadingSpinner } from './LoadingSpinner'
import './SaveDrawingModal.css'

export interface SaveDrawingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, projectId: string) => Promise<void>
}

export const SaveDrawingModal = ({ isOpen, onClose, onSave }: SaveDrawingModalProps) => {
  const [drawingName, setDrawingName] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setDrawingName('')
      setNewProjectName('')
      setIsCreatingNewProject(false)
      setError(null)
      setIsSaving(false)
      loadProjects()
      // Focus input when modal opens
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await projectService.getProjects()
      setProjects(response.projects)
      
      // Set first project as default selection if available
      if (response.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(response.projects[0].id)
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = drawingName.trim()

    // Validate drawing name
    if (!trimmedName) {
      setError('Drawing name is required')
      return
    }

    if (trimmedName.length < 2) {
      setError('Drawing name must be at least 2 characters')
      return
    }

    if (trimmedName.length > 100) {
      setError('Drawing name must be less than 100 characters')
      return
    }

    // Determine which project to use
    let projectId = selectedProjectId

    // If creating a new project, create it first
    if (isCreatingNewProject) {
      const trimmedProjectName = newProjectName.trim()

      if (!trimmedProjectName) {
        setError('Project name is required')
        return
      }

      if (trimmedProjectName.length < 2) {
        setError('Project name must be at least 2 characters')
        return
      }

      if (trimmedProjectName.length > 100) {
        setError('Project name must be less than 100 characters')
        return
      }

      try {
        setIsSaving(true)
        setError(null)
        const newProject = await projectService.createProject(trimmedProjectName)
        projectId = newProject.id
        toast.success('Project created successfully')
      } catch (err) {
        console.error('Failed to create project:', err)
        const errorMsg = 'Failed to create project. Please try again.'
        setError(errorMsg)
        toast.error(errorMsg)
        setIsSaving(false)
        return
      }
    } else if (!projectId && projects.length === 0) {
      setError('Please create a project first')
      return
    } else if (!projectId) {
      setError('Please select a project')
      return
    }

    // Save the drawing
    try {
      setIsSaving(true)
      setError(null)
      await onSave(trimmedName, projectId)
      toast.success('Drawing saved successfully')
      // Modal will be closed by parent component on success
    } catch (err) {
      console.error('Failed to save drawing:', err)
      const errorMsg = 'Failed to save drawing. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleProjectSelectionChange = (value: string) => {
    if (value === '__new__') {
      setIsCreatingNewProject(true)
      setSelectedProjectId('')
    } else {
      setIsCreatingNewProject(false)
      setSelectedProjectId(value)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content save-drawing-modal">
        <div className="modal-header">
          <h3>Save Drawing</h3>
          <button
            className="modal-close-button"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Drawing Name Input */}
            <div className="form-group">
              <label htmlFor="drawing-name">Drawing Name</label>
              <input
                ref={nameInputRef}
                id="drawing-name"
                type="text"
                className="form-input"
                value={drawingName}
                onChange={(e) => setDrawingName(e.target.value)}
                placeholder="Enter drawing name"
                disabled={isSaving}
                maxLength={100}
              />
            </div>

            {/* Project Selection */}
            {loading ? (
              <LoadingSpinner size="small" message="Loading projects..." />
            ) : (
              <div className="form-group">
                <label htmlFor="project-select">Project</label>
                <select
                  id="project-select"
                  className="form-select"
                  value={isCreatingNewProject ? '__new__' : selectedProjectId}
                  onChange={(e) => handleProjectSelectionChange(e.target.value)}
                  disabled={isSaving}
                >
                  {projects.length === 0 && !isCreatingNewProject && (
                    <option value="">No projects available</option>
                  )}
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.drawingCount}{' '}
                      {project.drawingCount === 1 ? 'drawing' : 'drawings'})
                    </option>
                  ))}
                  <option value="__new__">+ Create New Project</option>
                </select>
              </div>
            )}

            {/* New Project Name Input (shown when creating new project) */}
            {isCreatingNewProject && (
              <div className="form-group new-project-input">
                <label htmlFor="new-project-name">New Project Name</label>
                <input
                  id="new-project-name"
                  type="text"
                  className="form-input"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  disabled={isSaving}
                  maxLength={100}
                />
              </div>
            )}

            {/* Error Message */}
            {error && <p className="error-message">{error}</p>}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={
                isSaving ||
                !drawingName.trim() ||
                loading ||
                (isCreatingNewProject && !newProjectName.trim()) ||
                (!isCreatingNewProject && !selectedProjectId && projects.length > 0)
              }
            >
              {isSaving ? 'Saving...' : 'Save Drawing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

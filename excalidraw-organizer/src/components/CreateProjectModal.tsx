import { useState, useEffect, useRef } from 'react'
import { toast } from '../utils/toast'
import './CreateProjectModal.css'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}

export const CreateProjectModal = ({ isOpen, onClose, onCreate }: CreateProjectModalProps) => {
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setProjectName('')
      setError(null)
      setIsSubmitting(false)
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = projectName.trim()

    if (!trimmedName) {
      setError('Project name is required')
      return
    }

    if (trimmedName.length < 2) {
      setError('Project name must be at least 2 characters')
      return
    }

    if (trimmedName.length > 100) {
      setError('Project name must be less than 100 characters')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onCreate(trimmedName)
      toast.success('Project created successfully')
      // Modal will be closed by parent component on success
    } catch (err) {
      console.error('Failed to create project:', err)
      const errorMsg = 'Failed to create project. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content create-project-modal">
        <div className="modal-header">
          <h3>Create New Project</h3>
          <button
            className="modal-close-button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="project-name">Project Name</label>
              <input
                ref={inputRef}
                id="project-name"
                type="text"
                className="form-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                disabled={isSubmitting}
                maxLength={100}
              />
              {error && <p className="error-message">{error}</p>}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting || !projectName.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

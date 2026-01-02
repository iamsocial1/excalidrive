import { useState, useRef, useEffect } from 'react'
import type { Drawing } from '../types/drawing.types'
import { drawingService } from '../services/drawing.service'
import { toast } from '../utils/toast'
import { MoveDrawingModal } from './MoveDrawingModal'
import './DrawingCard.css'

export interface DrawingCardProps {
  drawing: Drawing
  viewMode: 'list' | 'icon'
  onRename: (id: string, newName: string) => void
  onDelete: (id: string) => void
  onShare: (id: string) => void
  onMove?: (id: string, projectId: string) => void
  onClick?: (id: string) => void
}

export const DrawingCard = ({
  drawing,
  viewMode,
  onRename,
  onDelete,
  onShare,
  onMove,
  onClick,
}: DrawingCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(drawing.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  const handleCardClick = () => {
    if (!isRenaming && !showDeleteConfirm && onClick) {
      onClick(drawing.id)
    }
  }

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isProcessing) return

    try {
      setIsProcessing(true)
      const shareUrl = await drawingService.createPublicLink(drawing.id)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      
      toast.success('Link copied to clipboard!')
      onShare(drawing.id)
    } catch (error) {
      console.error('Failed to create share link:', error)
      toast.error('Failed to create share link')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRenaming(true)
    setNewName(drawing.name)
  }

  const handleRenameSubmit = async () => {
    if (!newName.trim()) {
      toast.error('Drawing name cannot be empty')
      return
    }

    if (newName.trim() === drawing.name) {
      setIsRenaming(false)
      return
    }

    try {
      setIsProcessing(true)
      await drawingService.updateDrawing(drawing.id, { name: newName.trim() })
      onRename(drawing.id, newName.trim())
      setIsRenaming(false)
      toast.success('Drawing renamed successfully')
    } catch (error) {
      console.error('Failed to rename drawing:', error)
      toast.error('Failed to rename drawing')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewName(drawing.name)
    }
  }

  const handleRenameBlur = () => {
    if (!isProcessing) {
      setIsRenaming(false)
      setNewName(drawing.name)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsProcessing(true)
      await drawingService.deleteDrawing(drawing.id)
      onDelete(drawing.id)
      toast.success('Drawing deleted successfully')
    } catch (error) {
      console.error('Failed to delete drawing:', error)
      toast.error('Failed to delete drawing')
      setShowDeleteConfirm(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMoveModal(true)
  }

  const handleMoveDrawing = async (targetProjectId: string) => {
    try {
      await drawingService.moveDrawing(drawing.id, targetProjectId)
      toast.success('Drawing moved successfully')
      if (onMove) {
        onMove(drawing.id, targetProjectId)
      }
    } catch (error) {
      console.error('Failed to move drawing:', error)
      toast.error('Failed to move drawing')
      throw error
    }
  }

  const handleMoveModalClose = () => {
    setShowMoveModal(false)
  }

  if (viewMode === 'icon') {
    return (
      <div
        className={`drawing-card drawing-card-icon ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className="drawing-card-thumbnail">
          <img src={drawing.thumbnail} alt={drawing.name} />
          
          {isHovered && !showDeleteConfirm && (
            <div className="drawing-card-actions">
              <button
                className="action-button"
                onClick={handleShareClick}
                disabled={isProcessing}
                title="Create Public Shareable Link"
              >
                🔗
              </button>
              <button
                className="action-button"
                onClick={handleRenameClick}
                disabled={isProcessing}
                title="Rename"
              >
                ✏️
              </button>
              {onMove && (
                <button
                  className="action-button"
                  onClick={handleMoveClick}
                  disabled={isProcessing}
                  title="Move to Project"
                >
                  📁
                </button>
              )}
              <button
                className="action-button action-button-delete"
                onClick={handleDeleteClick}
                disabled={isProcessing}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="delete-confirm-overlay">
              <p>Delete this drawing?</p>
              <div className="delete-confirm-actions">
                <button
                  className="confirm-button confirm-delete"
                  onClick={handleDeleteConfirm}
                  disabled={isProcessing}
                >
                  Delete
                </button>
                <button
                  className="confirm-button confirm-cancel"
                  onClick={handleDeleteCancel}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="drawing-card-info">
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              className="rename-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameBlur}
              onClick={(e) => e.stopPropagation()}
              disabled={isProcessing}
            />
          ) : (
            <span className="drawing-card-name" title={drawing.name}>
              {drawing.name}
            </span>
          )}
          <span className="drawing-card-date">
            {formatDate(drawing.lastAccessedAt)}
          </span>
        </div>

        <MoveDrawingModal
          isOpen={showMoveModal}
          drawingName={drawing.name}
          currentProjectId={drawing.projectId}
          onClose={handleMoveModalClose}
          onMove={handleMoveDrawing}
        />
      </div>
    )
  }

  // List view
  return (
    <div
      className={`drawing-card drawing-card-list ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="drawing-card-thumbnail-small">
        <img src={drawing.thumbnail} alt={drawing.name} />
      </div>

      <div className="drawing-card-info-list">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            className="rename-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            onClick={(e) => e.stopPropagation()}
            disabled={isProcessing}
          />
        ) : (
          <span className="drawing-card-name" title={drawing.name}>
            {drawing.name}
          </span>
        )}
      </div>

      <div className="drawing-card-date-list">
        {formatDate(drawing.lastAccessedAt)}
      </div>

      {isHovered && !showDeleteConfirm && (
        <div className="drawing-card-actions-list">
          <button
            className="action-button"
            onClick={handleShareClick}
            disabled={isProcessing}
            title="Create Public Shareable Link"
          >
            🔗
          </button>
          <button
            className="action-button"
            onClick={handleRenameClick}
            disabled={isProcessing}
            title="Rename"
          >
            ✏️
          </button>
          {onMove && (
            <button
              className="action-button"
              onClick={handleMoveClick}
              disabled={isProcessing}
              title="Move to Project"
            >
              📁
            </button>
          )}
          <button
            className="action-button action-button-delete"
            onClick={handleDeleteClick}
            disabled={isProcessing}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-inline">
          <span>Delete?</span>
          <button
            className="confirm-button confirm-delete"
            onClick={handleDeleteConfirm}
            disabled={isProcessing}
          >
            Yes
          </button>
          <button
            className="confirm-button confirm-cancel"
            onClick={handleDeleteCancel}
            disabled={isProcessing}
          >
            No
          </button>
        </div>
      )}

      <MoveDrawingModal
        isOpen={showMoveModal}
        drawingName={drawing.name}
        currentProjectId={drawing.projectId}
        onClose={handleMoveModalClose}
        onMove={handleMoveDrawing}
      />
    </div>
  )
}

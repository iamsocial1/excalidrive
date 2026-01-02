import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { drawingService } from '../services/drawing.service'
import type { Drawing } from '../types/drawing.types'
import { DrawingCard } from './DrawingCard'
import { ViewModeToggle } from './ViewModeToggle'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorState } from './ErrorState'
import { useAuth } from '../contexts/AuthContext'
import './RecentSection.css'

export const RecentSection = () => {
  const { user } = useAuth()
  const [recentDrawings, setRecentDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'icon'>(() => {
    // Load from user preferences if authenticated, otherwise default to 'list'
    return user?.preferences?.defaultViewMode || 'list'
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadRecentDrawings()
  }, [])

  // Update view mode when user preferences change
  useEffect(() => {
    if (user?.preferences?.defaultViewMode) {
      setViewMode(user.preferences.defaultViewMode)
    }
  }, [user?.preferences?.defaultViewMode])

  const loadRecentDrawings = async (append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const offset = append ? recentDrawings.length : 0
      
      // Fetch recent drawings with pagination
      const result = await drawingService.getRecentDrawings(50, offset)
      
      if (append) {
        setRecentDrawings((prev) => [...prev, ...result.drawings])
      } else {
        setRecentDrawings(result.drawings)
      }
      
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('Failed to load recent drawings:', err)
      setError('Failed to load recent drawings. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const loadMore = () => {
    if (!loading && hasMore) {
      loadRecentDrawings(true)
    }
  }

  const handleDrawingClick = (drawingId: string) => {
    // Navigate to canvas page with the drawing ID
    navigate(`/?drawingId=${drawingId}`)
  }

  const handleRename = (id: string, newName: string) => {
    // Update the drawing name in the local state
    setRecentDrawings((prev) =>
      prev.map((drawing) =>
        drawing.id === id ? { ...drawing, name: newName } : drawing
      )
    )
  }

  const handleDelete = (id: string) => {
    // Remove the drawing from the local state
    setRecentDrawings((prev) => prev.filter((drawing) => drawing.id !== id))
  }

  const handleShare = (id: string) => {
    // Share handler - the DrawingCard component handles the actual sharing
    console.log('Drawing shared:', id)
  }

  const handleMove = (id: string, _targetProjectId: string) => {
    // Remove the drawing from the recent list after successful move
    setRecentDrawings((prev) => prev.filter((drawing) => drawing.id !== id))
  }

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

  if (loading) {
    return (
      <div className="recent-section">
        <div className="recent-section-header">
          <h2>Recent</h2>
        </div>
        <LoadingSpinner message="Loading recent drawings..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="recent-section">
        <div className="recent-section-header">
          <h2>Recent</h2>
        </div>
        <ErrorState 
          message={error} 
          onRetry={loadRecentDrawings}
        />
      </div>
    )
  }

  if (recentDrawings.length === 0) {
    return (
      <div className="recent-section">
        <div className="recent-section-header">
          <h2>Recent</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No recent drawings</h3>
          <p>Your recently accessed drawings will appear here.</p>
          <button onClick={() => navigate('/')} className="create-button">
            Create New Drawing
          </button>
        </div>
      </div>
    )
  }

  // Get top 10 drawings for the thumbnail carousel
  const carouselDrawings = recentDrawings.slice(0, 10)

  return (
    <div className="recent-section">
      <div className="recent-section-header">
        <h2>Recent</h2>
        <div className="header-actions">
          <span className="drawing-count">{recentDrawings.length} drawing{recentDrawings.length !== 1 ? 's' : ''}</span>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {/* Horizontal thumbnail carousel */}
      <div className="thumbnail-carousel">
        <div className="carousel-container">
          {carouselDrawings.map((drawing) => (
            <div
              key={drawing.id}
              className="carousel-item"
              onClick={() => handleDrawingClick(drawing.id)}
            >
              <div className="carousel-thumbnail">
                <img src={drawing.thumbnail} alt={drawing.name} />
              </div>
              <div className="carousel-info">
                <span className="carousel-name" title={drawing.name}>
                  {drawing.name}
                </span>
                <span className="carousel-date">{formatDate(drawing.lastAccessedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawings display with DrawingCard component */}
      <div className={`drawings-display ${viewMode === 'icon' ? 'icon-view' : 'list-view'}`}>
        {viewMode === 'list' && (
          <div className="list-header">
            <span className="list-header-thumbnail"></span>
            <span className="list-header-name">Name</span>
            <span className="list-header-date">Last Accessed</span>
            <span className="list-header-actions"></span>
          </div>
        )}
        <div className={`drawings-container ${viewMode === 'icon' ? 'icon-grid' : 'list-container'}`}>
          {recentDrawings.map((drawing) => (
            <DrawingCard
              key={drawing.id}
              drawing={drawing}
              viewMode={viewMode}
              onRename={handleRename}
              onDelete={handleDelete}
              onShare={handleShare}
              onMove={handleMove}
              onClick={handleDrawingClick}
            />
          ))}
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
    </div>
  )
}

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Excalidraw } from '@excalidraw/excalidraw'
import { drawingService } from '../services/drawing.service'
import type { Drawing } from '../types/drawing.types'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorState } from '../components/ErrorState'
import './PublicDrawingView.css'

export function PublicDrawingView() {
  const { shareId } = useParams<{ shareId: string }>()
  const navigate = useNavigate()
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareId) {
      setError('Invalid share link')
      setLoading(false)
      return
    }

    loadPublicDrawing(shareId)
  }, [shareId])

  // Prepare initial data for Excalidraw
  const initialData = useMemo(() => {
    if (!drawing) return undefined
    
    return {
      elements: drawing.excalidrawData,
      appState: drawing.appState as any,
      scrollToContent: true,
    }
  }, [drawing])

  const loadPublicDrawing = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const publicDrawing = await drawingService.getPublicDrawing(id)
      setDrawing(publicDrawing)
    } catch (err: any) {
      console.error('Failed to load public drawing:', err)
      
      if (err.response?.status === 404) {
        setError('This drawing does not exist or is no longer available.')
      } else if (err.response?.status === 410) {
        setError('This share link has expired.')
      } else {
        setError('Failed to load the drawing. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoHome = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="public-drawing-view">
        <LoadingSpinner fullScreen message="Loading drawing..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="public-drawing-view">
        <div className="public-drawing-error">
          <ErrorState 
            message={error}
            icon="⚠️"
          />
          <button onClick={handleGoHome} className="go-home-button">
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="public-drawing-view">
      <div className="public-drawing-header">
        <div className="drawing-info">
          <h1>{drawing?.name || 'Untitled Drawing'}</h1>
          <span className="read-only-badge">Read-only</span>
        </div>
        <button onClick={handleGoHome} className="home-button">
          Create Your Own
        </button>
      </div>
      <div className="public-drawing-canvas">
        <Excalidraw
          viewModeEnabled={true}
          zenModeEnabled={false}
          gridModeEnabled={false}
          initialData={initialData}
        />
      </div>
    </div>
  )
}

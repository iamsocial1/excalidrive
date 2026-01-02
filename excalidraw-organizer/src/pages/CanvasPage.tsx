import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useAuth } from '../contexts/AuthContext'
import { useDrawing } from '../contexts/DrawingContext'
import { AuthModal, type AuthMode, CustomExcalidrawMenu, SaveDrawingModal, LoadingSpinner, DrawingHeader } from '../components'
import { toast } from '../utils/toast'
import './CanvasPage.css'
import './excalidraw-isolation.css'

// Lazy load Excalidraw component for better initial load performance
const Excalidraw = lazy(() =>
  import('@excalidraw/excalidraw').then((module) => ({
    default: module.Excalidraw,
  }))
)

interface CanvasPageProps {
  initialDrawingData?: ExcalidrawElement[]
}

export function CanvasPage({ initialDrawingData }: CanvasPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { 
    pendingDrawing, 
    currentDrawing,
    currentDrawingId, 
    currentProjectName,
    setPendingDrawing, 
    setCurrentDrawing,
    setCurrentDrawingId, 
    setCurrentProjectName,
    saveDrawing,
    updateCurrentDrawing 
  } = useDrawing()
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [isSaving, setIsSaving] = useState(false)

  // Handle redirect after authentication
  useEffect(() => {
    if (user && location.state?.from) {
      // User just authenticated and was trying to access a protected route
      const from = location.state.from.pathname
      navigate(from, { replace: true })
    }
  }, [user, location.state, navigate])

  // Clear drawing state when starting a new drawing (no drawingId in URL)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const drawingId = searchParams.get('drawingId')
    
    if (!drawingId) {
      // No drawing ID means we're starting a new drawing
      setCurrentDrawing(null)
      setCurrentDrawingId(null)
      setCurrentProjectName(null)
    }
  }, [location.search, setCurrentDrawing, setCurrentDrawingId, setCurrentProjectName])

  // Load drawing from URL query parameter
  useEffect(() => {
    const loadDrawingFromUrl = async () => {
      const searchParams = new URLSearchParams(location.search)
      const drawingId = searchParams.get('drawingId')
      
      if (drawingId && excalidrawAPI) {
        try {
          const { drawingService } = await import('../services/drawing.service')
          const { projectService } = await import('../services/project.service')
          const drawing = await drawingService.getDrawing(drawingId)
          
          // Set the current drawing and ID so we can quick save
          setCurrentDrawing(drawing)
          setCurrentDrawingId(drawingId)
          
          // Fetch project information and set currentProjectName
          try {
            const project = await projectService.getProject(drawing.projectId)
            setCurrentProjectName(project.name)
          } catch (error) {
            console.error('Failed to load project information:', error)
            // Don't show error to user, just log it
            setCurrentProjectName(null)
          }
          
          // Load the drawing data into Excalidraw
          // Only pass elements, let Excalidraw handle the appState
          excalidrawAPI.updateScene({
            elements: drawing.excalidrawData,
          })
          
          // Note: last_accessed_at is automatically updated by the GET endpoint
        } catch (error) {
          console.error('Failed to load drawing:', error)
          toast.error('Failed to load drawing')
        }
      }
    }

    loadDrawingFromUrl()
  }, [location.search, excalidrawAPI, setCurrentDrawing, setCurrentDrawingId, setCurrentProjectName])

  // Handle save attempts - will be triggered by custom menu or save action
  const handleSave = useCallback(
    async (elements: ExcalidrawElement[], appState: Partial<AppState>) => {
      // Check if user is authenticated
      if (!user) {
        // Save drawing data to pending state
        setPendingDrawing(elements, appState)
        // Open auth modal
        setAuthMode('signup')
        setIsAuthModalOpen(true)
        return
      }

      // User is authenticated - check if this is an existing drawing
      if (currentDrawingId) {
        // Quick save to existing drawing
        try {
          setIsSaving(true)
          await updateCurrentDrawing(elements, appState)
          
          // Show success toast notification
          toast.success('Drawing saved successfully!')
        } catch (error) {
          console.error('Failed to save drawing:', error)
          toast.error('Failed to save drawing. Please try again.')
        } finally {
          setIsSaving(false)
        }
      } else {
        // New drawing - save current state and open save modal
        setPendingDrawing(elements, appState)
        setIsSaveModalOpen(true)
      }
    },
    [user, currentDrawingId, setPendingDrawing, updateCurrentDrawing]
  )

  // Handle keyboard shortcuts (Ctrl+S / Cmd+S for save)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault() // Prevent browser's default save dialog
        
        // Trigger save
        if (excalidrawAPI) {
          const elements = excalidrawAPI.getSceneElements()
          const appState = excalidrawAPI.getAppState()
          handleSave([...elements], appState)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [excalidrawAPI, handleSave])

  // Handle auth success
  const handleAuthSuccess = useCallback(() => {
    setIsAuthModalOpen(false)
    
    // If there's a pending drawing, open save modal to complete the save
    if (pendingDrawing) {
      setIsSaveModalOpen(true)
    }
  }, [pendingDrawing])

  // Handle auth modal close
  const handleAuthModalClose = useCallback(() => {
    setIsAuthModalOpen(false)
    // Keep pending drawing in case user wants to try again
  }, [])

  // Handle save modal close
  const handleSaveModalClose = useCallback(() => {
    setIsSaveModalOpen(false)
    // Keep pending drawing in case user wants to try again
  }, [])

  // Handle save drawing
  const handleSaveDrawing = useCallback(
    async (name: string, projectId: string) => {
      if (!pendingDrawing) {
        toast.error('No drawing data to save')
        return
      }

      try {
        setIsSaving(true)
        const savedDrawing = await saveDrawing(
          pendingDrawing.elements,
          pendingDrawing.appState || {},
          projectId,
          name
        )
        
        // The saveDrawing function in DrawingContext already sets currentDrawingId
        // but we can also set it here for clarity
        setCurrentDrawingId(savedDrawing.id)
        
        // Fetch project information and set currentProjectName
        try {
          const { projectService } = await import('../services/project.service')
          const project = await projectService.getProject(projectId)
          setCurrentProjectName(project.name)
        } catch (error) {
          console.error('Failed to load project information:', error)
          // Don't show error to user, just log it
          setCurrentProjectName(null)
        }
        
        // Show success toast notification
        toast.success('Drawing saved successfully!')
        setIsSaveModalOpen(false)
      } catch (error) {
        console.error('Failed to save drawing:', error)
        toast.error('Failed to save drawing. Please try again.')
        throw error // Re-throw to let modal handle it
      } finally {
        setIsSaving(false)
      }
    },
    [pendingDrawing, saveDrawing, setCurrentDrawingId, setCurrentProjectName]
  )

  // Handle signup click from menu
  const handleSignupClick = useCallback(() => {
    setAuthMode('signup')
    setIsAuthModalOpen(true)
  }, [])

  // Handle signin click from menu
  const handleSigninClick = useCallback(() => {
    setAuthMode('signin')
    setIsAuthModalOpen(true)
  }, [])

  // Handle browse files click from menu
  const handleBrowseFilesClick = useCallback(() => {
    navigate('/browser/recent')
  }, [navigate])

  // Handle Excalidraw onChange
  const handleChange = useCallback(
    (_elements: readonly ExcalidrawElement[], _appState: AppState) => {
      // Store current state in case we need it
      // This is called frequently, so we don't do anything heavy here
    },
    []
  )

  // Expose save handler to custom menu
  const handleSaveClick = useCallback(() => {
    if (excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements()
      const appState = excalidrawAPI.getAppState()
      // Convert readonly array to mutable array
      handleSave([...elements], appState)
    }
  }, [excalidrawAPI, handleSave])

  return (
    <div className="canvas-page">
      {/* Saving Indicator */}
      {isSaving && (
        <div className="toast-notification info">
          Saving...
        </div>
      )}

      {/* Drawing Header - shows drawing and project name */}
      <DrawingHeader
        drawingName={currentDrawing?.name || null}
        projectName={currentProjectName}
        isAuthenticated={isAuthenticated}
      />

      <div className="excalidraw-wrapper">
        <Suspense fallback={<LoadingSpinner message="Loading canvas..." />}>
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={{
              elements: initialDrawingData || pendingDrawing?.elements || [],
              appState: {
                ...pendingDrawing?.appState,
                viewBackgroundColor: '#ffffff',
              },
            }}
            onChange={handleChange}
          >
            <CustomExcalidrawMenu
              onSignupClick={handleSignupClick}
              onSigninClick={handleSigninClick}
              onBrowseFilesClick={handleBrowseFilesClick}
              onSaveClick={handleSaveClick}
            />
          </Excalidraw>
        </Suspense>
      </div>

      <AuthModal
        mode={authMode}
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
        onSuccess={handleAuthSuccess}
      />

      <SaveDrawingModal
        isOpen={isSaveModalOpen}
        onClose={handleSaveModalClose}
        onSave={handleSaveDrawing}
      />
    </div>
  )
}

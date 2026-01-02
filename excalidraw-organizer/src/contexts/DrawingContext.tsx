import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState } from '@excalidraw/excalidraw/types'
import type { Drawing, PendingDrawing } from '../types'
import { drawingService } from '../services/drawing.service'
import { debounce } from '../utils/debounce.utils'

interface DrawingContextValue {
  currentDrawing: Drawing | null
  currentDrawingId: string | null
  currentProjectName: string | null
  pendingDrawing: PendingDrawing | null
  recentDrawings: Drawing[]
  setCurrentDrawing: (drawing: Drawing | null) => void
  setCurrentDrawingId: (id: string | null) => void
  setCurrentProjectName: (name: string | null) => void
  setPendingDrawing: (elements: ExcalidrawElement[], appState?: Partial<AppState>) => void
  clearPendingDrawing: () => void
  saveDrawing: (
    data: ExcalidrawElement[],
    appState: Partial<AppState>,
    projectId: string,
    name: string
  ) => Promise<Drawing>
  updateCurrentDrawing: (
    data: ExcalidrawElement[],
    appState?: Partial<AppState>
  ) => Promise<Drawing>
  refreshRecentDrawings: () => Promise<void>
  autoSaveDrawing: (
    drawingId: string,
    data: ExcalidrawElement[],
    appState?: Partial<AppState>
  ) => void
  enableAutoSave: (drawingId: string) => void
  disableAutoSave: () => void
}

const DrawingContext = createContext<DrawingContextValue | undefined>(undefined)

export function DrawingProvider({ children }: { children: ReactNode }) {
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null)
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(null)
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null)
  const [pendingDrawing, setPendingDrawingState] = useState<PendingDrawing | null>(null)
  const [recentDrawings, setRecentDrawings] = useState<Drawing[]>([])
  const autoSaveDrawingIdRef = useRef<string | null>(null)

  // Debounced auto-save function (2 seconds delay)
  const debouncedAutoSave = useRef(
    debounce(async (
      drawingId: string,
      data: ExcalidrawElement[],
      appState?: Partial<AppState>
    ) => {
      try {
        await drawingService.updateDrawing(drawingId, {
          excalidrawData: data,
          appState,
        })
        console.log('Auto-saved drawing:', drawingId)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 2000)
  ).current

  // Listen for signout events to clear cached drawing data
  useEffect(() => {
    const handleSignout = () => {
      setCurrentDrawing(null)
      setCurrentDrawingId(null)
      setCurrentProjectName(null)
      setPendingDrawingState(null)
      setRecentDrawings([])
      autoSaveDrawingIdRef.current = null
    }

    window.addEventListener('auth:signout', handleSignout)

    return () => {
      window.removeEventListener('auth:signout', handleSignout)
    }
  }, [])

  const setPendingDrawing = useCallback(
    (elements: ExcalidrawElement[], appState?: Partial<AppState>) => {
      setPendingDrawingState({ elements, appState })
    },
    []
  )

  const clearPendingDrawing = useCallback(() => {
    setPendingDrawingState(null)
  }, [])

  const refreshRecentDrawings = useCallback(async () => {
    try {
      const result = await drawingService.getRecentDrawings(50)
      setRecentDrawings(result.drawings)
    } catch (error) {
      console.error('Failed to refresh recent drawings:', error)
    }
  }, [])

  const saveDrawing = useCallback(
    async (
      data: ExcalidrawElement[],
      appState: Partial<AppState>,
      projectId: string,
      name: string
    ): Promise<Drawing> => {
      // Save drawing using DrawingService
      const savedDrawing = await drawingService.saveDrawing(
        name,
        projectId,
        data,
        appState
      )
      
      // Set the current drawing ID after successful save
      setCurrentDrawingId(savedDrawing.id)
      setCurrentDrawing(savedDrawing)
      
      // Clear pending drawing after successful save
      clearPendingDrawing()
      
      // Refresh recent drawings list
      await refreshRecentDrawings()
      
      return savedDrawing
    },
    [clearPendingDrawing, refreshRecentDrawings]
  )

  const updateCurrentDrawing = useCallback(
    async (
      data: ExcalidrawElement[],
      appState?: Partial<AppState>
    ): Promise<Drawing> => {
      if (!currentDrawingId) {
        throw new Error('No current drawing to update')
      }

      // Update drawing content using DrawingService
      const updatedDrawing = await drawingService.updateDrawingContent(
        currentDrawingId,
        data,
        appState
      )
      
      // Update current drawing state
      setCurrentDrawing(updatedDrawing)
      
      // Refresh recent drawings list to update timestamps
      await refreshRecentDrawings()
      
      return updatedDrawing
    },
    [currentDrawingId, refreshRecentDrawings]
  )

  const autoSaveDrawing = useCallback(
    (
      drawingId: string,
      data: ExcalidrawElement[],
      appState?: Partial<AppState>
    ) => {
      // Only auto-save if this drawing is enabled for auto-save
      if (autoSaveDrawingIdRef.current === drawingId) {
        debouncedAutoSave(drawingId, data, appState)
      }
    },
    [debouncedAutoSave]
  )

  const enableAutoSave = useCallback((drawingId: string) => {
    autoSaveDrawingIdRef.current = drawingId
  }, [])

  const disableAutoSave = useCallback(() => {
    autoSaveDrawingIdRef.current = null
  }, [])

  return (
    <DrawingContext.Provider
      value={{
        currentDrawing,
        currentDrawingId,
        currentProjectName,
        pendingDrawing,
        recentDrawings,
        setCurrentDrawing,
        setCurrentDrawingId,
        setCurrentProjectName,
        setPendingDrawing,
        clearPendingDrawing,
        saveDrawing,
        updateCurrentDrawing,
        refreshRecentDrawings,
        autoSaveDrawing,
        enableAutoSave,
        disableAutoSave,
      }}
    >
      {children}
    </DrawingContext.Provider>
  )
}

export function useDrawing() {
  const context = useContext(DrawingContext)
  if (context === undefined) {
    throw new Error('useDrawing must be used within a DrawingProvider')
  }
  return context
}

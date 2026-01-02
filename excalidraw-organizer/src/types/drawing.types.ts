import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState } from '@excalidraw/excalidraw/types'

export interface Drawing {
  id: string
  name: string
  userId: string
  projectId: string
  excalidrawData: ExcalidrawElement[]
  appState?: Partial<AppState>
  thumbnail: string
  createdAt: Date
  updatedAt: Date
  lastAccessedAt: Date
  isPublic: boolean
  publicShareId?: string
}

export interface PendingDrawing {
  elements: ExcalidrawElement[]
  appState?: Partial<AppState>
}

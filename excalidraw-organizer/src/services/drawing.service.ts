import { apiClient } from '../utils/api.client'
import type { Drawing } from '../types/drawing.types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState } from '@excalidraw/excalidraw/types'
import { exportToCanvas } from '@excalidraw/excalidraw'
import { thumbnailCache } from '../utils/cache.utils'

interface SaveDrawingRequest {
  name: string
  projectId: string
  excalidrawData: ExcalidrawElement[]
  appState?: Partial<AppState>
  thumbnail: string
}

interface UpdateDrawingRequest {
  name?: string
  excalidrawData?: ExcalidrawElement[]
  appState?: Partial<AppState>
  thumbnail?: string
  projectId?: string
}

interface MoveDrawingRequest {
  targetProjectId: string
}

class DrawingService {
  /**
   * Save a new drawing
   */
  async saveDrawing(
    name: string,
    projectId: string,
    excalidrawData: ExcalidrawElement[],
    appState?: Partial<AppState>
  ): Promise<Drawing> {
    // Generate thumbnail from Excalidraw data
    const thumbnail = await this.generateThumbnail(excalidrawData, appState)

    const payload: SaveDrawingRequest = {
      name,
      projectId,
      excalidrawData,
      appState,
      thumbnail,
    }

    const response = await apiClient.post<{ drawing: Drawing }>('/drawings', payload)
    return this.parseDrawingDates(response.data.drawing)
  }

  /**
   * Get a drawing by ID
   */
  async getDrawing(id: string): Promise<Drawing> {
    const response = await apiClient.get<{ drawing: Drawing }>(`/drawings/${id}`)
    const drawing = this.parseDrawingDates(response.data.drawing)
    
    // Cache thumbnail if available
    if (drawing.thumbnail) {
      thumbnailCache.set(id, drawing.thumbnail)
    }
    
    return drawing
  }

  /**
   * Update an existing drawing
   */
  async updateDrawing(
    id: string,
    updates: {
      name?: string
      excalidrawData?: ExcalidrawElement[]
      appState?: Partial<AppState>
      projectId?: string
    }
  ): Promise<Drawing> {
    const payload: UpdateDrawingRequest = { ...updates }

    // Generate new thumbnail if excalidrawData is updated
    if (updates.excalidrawData) {
      payload.thumbnail = await this.generateThumbnail(
        updates.excalidrawData,
        updates.appState
      )
    }

    const response = await apiClient.put<{ drawing: Drawing }>(`/drawings/${id}`, payload)
    return this.parseDrawingDates(response.data.drawing)
  }

  /**
   * Update drawing content only (for quick save)
   * This is optimized for frequent saves and automatically generates thumbnails
   */
  async updateDrawingContent(
    id: string,
    excalidrawData: ExcalidrawElement[],
    appState?: Partial<AppState>
  ): Promise<Drawing> {
    // Generate new thumbnail
    const thumbnail = await this.generateThumbnail(excalidrawData, appState)

    const payload: UpdateDrawingRequest = {
      excalidrawData,
      appState,
      thumbnail,
    }

    const response = await apiClient.put<{ drawing: Drawing }>(`/drawings/${id}`, payload)
    return this.parseDrawingDates(response.data.drawing)
  }

  /**
   * Delete a drawing
   */
  async deleteDrawing(id: string): Promise<void> {
    await apiClient.delete(`/drawings/${id}`)
    // Remove from cache
    thumbnailCache.remove(id)
  }

  /**
   * Get recent drawings with optional limit and pagination
   */
  async getRecentDrawings(limit: number = 50, offset: number = 0): Promise<{
    drawings: Drawing[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const response = await apiClient.get<{
      drawings: Drawing[];
      totalCount: number;
      hasMore: boolean;
    }>('/drawings/recent', {
      params: { limit, offset },
    })
    
    const drawings = response.data.drawings.map((drawing) => {
      const parsed = this.parseDrawingDates(drawing)
      // Cache thumbnails
      if (parsed.thumbnail) {
        thumbnailCache.set(parsed.id, parsed.thumbnail)
      }
      return parsed
    })
    
    return {
      drawings,
      totalCount: response.data.totalCount,
      hasMore: response.data.hasMore,
    }
  }

  /**
   * Get drawings by project ID with pagination
   */
  async getDrawingsByProject(
    projectId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    drawings: Drawing[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const response = await apiClient.get<{
      drawings: Drawing[];
      totalCount: number;
      hasMore: boolean;
    }>(`/drawings/project/${projectId}`, {
      params: { limit, offset },
    })
    
    const drawings = response.data.drawings.map((drawing) => {
      const parsed = this.parseDrawingDates(drawing)
      // Cache thumbnails
      if (parsed.thumbnail) {
        thumbnailCache.set(parsed.id, parsed.thumbnail)
      }
      return parsed
    })
    
    return {
      drawings,
      totalCount: response.data.totalCount,
      hasMore: response.data.hasMore,
    }
  }

  /**
   * Move a drawing to a different project
   */
  async moveDrawing(drawingId: string, targetProjectId: string): Promise<void> {
    const payload: MoveDrawingRequest = { targetProjectId }
    await apiClient.put(`/drawings/${drawingId}/move`, payload)
  }

  /**
   * Create a public shareable link for a drawing
   */
  async createPublicLink(drawingId: string): Promise<string> {
    const response = await apiClient.post<{ shareUrl?: string; shareId: string }>(
      `/drawings/${drawingId}/share`
    )
    
    // If backend provides full URL, use it; otherwise construct it
    if (response.data.shareUrl) {
      return response.data.shareUrl
    }
    
    // Construct the full URL using the current origin and shareId
    const origin = window.location.origin
    return `${origin}/public/${response.data.shareId}`
  }

  /**
   * Get a public drawing by share ID (no authentication required)
   */
  async getPublicDrawing(shareId: string): Promise<Drawing> {
    const response = await apiClient.get<{ drawing: Drawing }>(`/public/${shareId}`)
    return this.parseDrawingDates(response.data.drawing)
  }

  /**
   * Generate a thumbnail from Excalidraw data using canvas API
   * Uses WebP format for better compression
   */
  async generateThumbnail(
    elements: ExcalidrawElement[],
    appState?: Partial<AppState>
  ): Promise<string> {
    try {
      // Use Excalidraw's exportToCanvas utility
      const canvas = await exportToCanvas({
        elements,
        appState: {
          ...appState,
          exportBackground: true,
          viewBackgroundColor: '#ffffff',
        },
        files: null,
      })

      // Create a smaller thumbnail canvas
      const thumbnailCanvas = document.createElement('canvas')
      const thumbnailWidth = 300
      const thumbnailHeight = 200
      thumbnailCanvas.width = thumbnailWidth
      thumbnailCanvas.height = thumbnailHeight

      const ctx = thumbnailCanvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Calculate scaling to fit the drawing in the thumbnail
      const scale = Math.min(
        thumbnailWidth / canvas.width,
        thumbnailHeight / canvas.height
      )

      const scaledWidth = canvas.width * scale
      const scaledHeight = canvas.height * scale
      const x = (thumbnailWidth - scaledWidth) / 2
      const y = (thumbnailHeight - scaledHeight) / 2

      // Fill background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight)

      // Draw the scaled image
      ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight)

      // Try WebP format first (better compression), fallback to PNG
      try {
        const webpData = thumbnailCanvas.toDataURL('image/webp', 0.8)
        // Check if WebP is supported (some browsers return PNG even if WebP is requested)
        if (webpData.startsWith('data:image/webp')) {
          return webpData
        }
      } catch (webpError) {
        console.warn('WebP not supported, falling back to PNG')
      }

      // Fallback to PNG with compression
      return thumbnailCanvas.toDataURL('image/png', 0.8)
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      // Return a placeholder or empty thumbnail
      return this.generatePlaceholderThumbnail()
    }
  }

  /**
   * Generate a placeholder thumbnail when thumbnail generation fails
   */
  private generatePlaceholderThumbnail(): string {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 200

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return ''
    }

    // Draw a simple placeholder
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, 300, 200)
    ctx.fillStyle = '#999999'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('No Preview', 150, 100)

    return canvas.toDataURL('image/png')
  }

  /**
   * Parse date strings to Date objects
   */
  private parseDrawingDates(drawing: Drawing): Drawing {
    return {
      ...drawing,
      createdAt: new Date(drawing.createdAt),
      updatedAt: new Date(drawing.updatedAt),
      lastAccessedAt: new Date(drawing.lastAccessedAt),
    }
  }
}

// Export singleton instance
export const drawingService = new DrawingService()

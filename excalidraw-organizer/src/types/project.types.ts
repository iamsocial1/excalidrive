export interface Project {
  id: string
  name: string
  userId: string
  drawingCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectRequest {
  name: string
}

export interface UpdateProjectRequest {
  name?: string
}

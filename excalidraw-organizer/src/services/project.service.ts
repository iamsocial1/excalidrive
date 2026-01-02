import { apiClient } from '../utils/api.client'
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/project.types'

class ProjectService {
  /**
   * Create a new project
   */
  async createProject(name: string): Promise<Project> {
    const payload: CreateProjectRequest = { name }
    const response = await apiClient.post<{ project: Project }>('/projects', payload)
    return this.parseProjectDates(response.data.project)
  }

  /**
   * Get all projects for the current user with pagination
   */
  async getProjects(limit: number = 100, offset: number = 0): Promise<{
    projects: Project[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const response = await apiClient.get<{
      projects: Project[];
      totalCount: number;
      hasMore: boolean;
    }>('/projects', {
      params: { limit, offset },
    })
    
    return {
      projects: response.data.projects.map((project) => this.parseProjectDates(project)),
      totalCount: response.data.totalCount,
      hasMore: response.data.hasMore,
    }
  }

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get<{ project: Project }>(`/projects/${id}`)
    return this.parseProjectDates(response.data.project)
  }

  /**
   * Update a project
   */
  async updateProject(id: string, updates: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<{ project: Project }>(`/projects/${id}`, updates)
    return this.parseProjectDates(response.data.project)
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`)
  }

  /**
   * Parse date strings to Date objects
   */
  private parseProjectDates(project: Project): Project {
    return {
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService()

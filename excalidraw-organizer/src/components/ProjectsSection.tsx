import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../services/project.service'
import type { Project } from '../types/project.types'
import { CreateProjectModal } from './CreateProjectModal'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorState } from './ErrorState'
import './ProjectsSection.css'

export const ProjectsSection = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async (append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const offset = append ? projects.length : 0
      const result = await projectService.getProjects(100, offset)
      
      if (append) {
        setProjects((prev) => [...prev, ...result.projects])
      } else {
        setProjects(result.projects)
      }
      
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const loadMore = () => {
    if (!loading && hasMore) {
      loadProjects(true)
    }
  }

  const handleProjectClick = (projectId: string) => {
    navigate(`/browser/projects/${projectId}`)
  }

  const handleCreateProject = async (name: string) => {
    try {
      const newProject = await projectService.createProject(name)
      setProjects((prev) => [...prev, newProject])
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error('Failed to create project:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="projects-section">
        <LoadingSpinner message="Loading projects..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="projects-section">
        <ErrorState 
          message={error} 
          onRetry={loadProjects}
        />
      </div>
    )
  }

  return (
    <div className="projects-section">
      <div className="projects-header">
        <h2>Projects</h2>
        <button className="create-project-button" onClick={() => setIsCreateModalOpen(true)}>
          <span className="button-icon">+</span>
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to organize your drawings</p>
          <button className="create-button" onClick={() => setIsCreateModalOpen(true)}>
            Create Project
          </button>
        </div>
      ) : (
        <>
          <div className="projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="project-icon">📁</div>
                <div className="project-info">
                  <h3 className="project-name">{project.name}</h3>
                  <p className="project-count">
                    {project.drawingCount} {project.drawingCount === 1 ? 'drawing' : 'drawings'}
                  </p>
                </div>
              </div>
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
        </>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  )
}

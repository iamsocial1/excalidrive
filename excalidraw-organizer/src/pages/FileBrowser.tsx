import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LeftPanel } from '../components/LeftPanel'
import { RecentSection } from '../components/RecentSection'
import { ProjectsSection } from '../components/ProjectsSection'
import { ProjectDetailView } from '../components/ProjectDetailView'
import { SettingsSection } from '../components/SettingsSection'
import './FileBrowser.css'

export const FileBrowser = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('leftPanelCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  const handleTogglePanel = () => {
    setIsPanelCollapsed((prev: boolean) => {
      const newValue = !prev
      localStorage.setItem('leftPanelCollapsed', JSON.stringify(newValue))
      return newValue
    })
  }

  return (
    <div className="file-browser">
      <LeftPanel isCollapsed={isPanelCollapsed} onToggle={handleTogglePanel} />
      <main className={`file-browser-content ${isPanelCollapsed ? 'expanded' : ''}`}>
        <Routes>
          <Route path="recent" element={<RecentSection />} />
          <Route path="projects" element={<ProjectsSection />} />
          <Route path="projects/:projectId" element={<ProjectDetailView />} />
          <Route path="settings" element={<SettingsSection />} />
          <Route path="*" element={<Navigate to="recent" replace />} />
        </Routes>
      </main>
    </div>
  )
}

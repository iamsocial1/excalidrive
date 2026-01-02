import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DrawingProvider } from './contexts/DrawingContext'
import { ProtectedRoute, ErrorBoundary, OfflineIndicator } from './components'
import { CanvasPage, FileBrowser, PublicDrawingView } from './pages'
import './App.css'
import './utils/toast.css'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <DrawingProvider>
            <OfflineIndicator />
            <Routes>
              <Route path="/" element={<CanvasPage />} />
              <Route path="/canvas" element={<CanvasPage />} />
              <Route 
                path="/browser/*" 
                element={
                  <ProtectedRoute>
                    <FileBrowser />
                  </ProtectedRoute>
                } 
              />
              <Route path="/public/:shareId" element={<PublicDrawingView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DrawingProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

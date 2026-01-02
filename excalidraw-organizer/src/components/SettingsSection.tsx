import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/auth.service'
import { toast } from '../utils/toast'
import './SettingsSection.css'

type TabType = 'theme' | 'password' | 'profile'

export const SettingsSection = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('theme')
  
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(
    user?.preferences?.theme || 'system'
  )
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // Profile state
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setSelectedTheme(user.preferences?.theme || 'system')
    }
  }, [user])

  // Apply theme immediately
  useEffect(() => {
    applyTheme(selectedTheme)
  }, [selectedTheme])

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(theme)
    
    try {
      await updateUser({
        preferences: {
          theme,
        },
      })
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    setPasswordLoading(true)

    try {
      await authService.changePassword(currentPassword, newPassword)
      setPasswordSuccess('Password changed successfully')
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to change password'
      setPasswordError(errorMsg)
      toast.error(errorMsg)
      console.error('Password change error:', error)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')

    if (!name.trim()) {
      setProfileError('Name cannot be empty')
      return
    }

    if (name === user?.name) {
      setProfileError('Name is unchanged')
      return
    }

    setProfileLoading(true)

    try {
      await updateUser({ name: name.trim() })
      setProfileSuccess('Name updated successfully')
      toast.success('Name updated successfully')
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update name'
      setProfileError(errorMsg)
      toast.error(errorMsg)
      console.error('Name update error:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')

    if (!email.trim()) {
      setProfileError('Email cannot be empty')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setProfileError('Please enter a valid email address')
      return
    }

    if (email === user?.email) {
      setProfileError('Email is unchanged')
      return
    }

    setProfileLoading(true)

    try {
      await updateUser({ email: email.trim() })
      setProfileSuccess('Email updated successfully')
      toast.success('Email updated successfully')
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update email'
      setProfileError(errorMsg)
      toast.error(errorMsg)
      console.error('Email update error:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <div className="settings-section">
      <h1 className="settings-title">Settings</h1>

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          Theme
        </button>
        <button
          className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Password
        </button>
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'theme' && (
          <div className="settings-panel">
            <h2>Theme Preferences</h2>
            <p className="panel-description">
              Choose how the application looks. System theme will match your device settings.
            </p>

            <div className="theme-options">
              <label className={`theme-option ${selectedTheme === 'light' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={selectedTheme === 'light'}
                  onChange={() => handleThemeChange('light')}
                />
                <div className="theme-option-content">
                  <span className="theme-icon">☀️</span>
                  <span className="theme-label">Light</span>
                </div>
              </label>

              <label className={`theme-option ${selectedTheme === 'dark' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={selectedTheme === 'dark'}
                  onChange={() => handleThemeChange('dark')}
                />
                <div className="theme-option-content">
                  <span className="theme-icon">🌙</span>
                  <span className="theme-label">Dark</span>
                </div>
              </label>

              <label className={`theme-option ${selectedTheme === 'system' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={selectedTheme === 'system'}
                  onChange={() => handleThemeChange('system')}
                />
                <div className="theme-option-content">
                  <span className="theme-icon">💻</span>
                  <span className="theme-label">System</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="settings-panel">
            <h2>Change Password</h2>
            <p className="panel-description">
              Update your password to keep your account secure.
            </p>

            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="form-group">
                <label htmlFor="current-password">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={passwordLoading}
                />
              </div>

              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

              <button type="submit" className="submit-button" disabled={passwordLoading}>
                {passwordLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="settings-panel">
            <h2>Profile Information</h2>
            <p className="panel-description">
              Update your name and email address.
            </p>

            <form onSubmit={handleNameChange} className="settings-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={profileLoading}
                />
              </div>

              <button type="submit" className="submit-button" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Name'}
              </button>
            </form>

            <form onSubmit={handleEmailChange} className="settings-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={profileLoading}
                />
              </div>

              {profileError && <div className="error-message">{profileError}</div>}
              {profileSuccess && <div className="success-message">{profileSuccess}</div>}

              <button type="submit" className="submit-button" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Email'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

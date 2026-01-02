/**
 * Simple toast notification utility
 */

export type ToastType = 'success' | 'error' | 'info'

interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
}

class ToastManager {
  private container: HTMLDivElement | null = null

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'toast-container'
      document.body.appendChild(this.container)
    }
    return this.container
  }

  show(options: ToastOptions) {
    const { message, type = 'info', duration = 3000 } = options
    const container = this.ensureContainer()

    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message

    container.appendChild(toast)

    // Trigger animation
    setTimeout(() => {
      toast.classList.add('toast-show')
    }, 10)

    // Remove toast after duration
    setTimeout(() => {
      toast.classList.remove('toast-show')
      setTimeout(() => {
        container.removeChild(toast)
      }, 300)
    }, duration)
  }

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration })
  }

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration })
  }

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration })
  }
}

export const toast = new ToastManager()

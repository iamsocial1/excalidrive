import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import './AuthModal.css';

export type AuthMode = 'signup' | 'signin' | 'forgot-password' | 'reset-password';

interface AuthModalProps {
  mode: AuthMode;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resetToken?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  mode: initialMode,
  isOpen,
  onClose,
  onSuccess,
  resetToken,
}) => {
  const { signin, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Reset form when mode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      resetForm();
    }
  }, [isOpen, initialMode]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setSuccessMessage('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateSignupForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSigninForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotPasswordForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetPasswordForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignupForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await signup(name.trim(), email.trim(), password);
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || 'Signup failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSigninForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await signin(email.trim(), password);
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || 'Invalid email or password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForgotPasswordForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await authService.forgotPassword(email.trim());
      setSuccessMessage('Password reset link sent to your email.');
      setEmail('');
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || 'Failed to send reset email. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateResetPasswordForm()) {
      return;
    }

    if (!resetToken) {
      setErrors({ general: 'Invalid reset token.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await authService.resetPassword(resetToken, password);
      setSuccessMessage('Password reset successful. You can now sign in.');
      setTimeout(() => {
        setMode('signin');
        resetForm();
      }, 2000);
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || 'Failed to reset password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    switch (mode) {
      case 'signup':
        return handleSignup(e);
      case 'signin':
        return handleSignin(e);
      case 'forgot-password':
        return handleForgotPassword(e);
      case 'reset-password':
        return handleResetPassword(e);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create Account';
      case 'signin':
        return 'Sign In';
      case 'forgot-password':
        return 'Reset Password';
      case 'reset-password':
        return 'Set New Password';
    }
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return 'Please wait...';
    }
    
    switch (mode) {
      case 'signup':
        return 'Sign Up';
      case 'signin':
        return 'Sign In';
      case 'forgot-password':
        return 'Send Reset Link';
      case 'reset-password':
        return 'Reset Password';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="auth-modal-title">{getTitle()}</h2>

        {errors.general && (
          <div className="auth-error-message" role="alert">
            {errors.general}
          </div>
        )}

        {successMessage && (
          <div className="auth-success-message" role="status">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === 'signup' && (
            <div className="auth-form-group">
              <label htmlFor="name" className="auth-form-label">
                Name
              </label>
              <input
                id="name"
                type="text"
                className={`auth-form-input ${errors.name ? 'auth-form-input-error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isSubmitting}
                autoComplete="name"
              />
              {errors.name && (
                <span className="auth-field-error">{errors.name}</span>
              )}
            </div>
          )}

          {(mode === 'signup' || mode === 'signin' || mode === 'forgot-password') && (
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={`auth-form-input ${errors.email ? 'auth-form-input-error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isSubmitting}
                autoComplete="email"
              />
              {errors.email && (
                <span className="auth-field-error">{errors.email}</span>
              )}
            </div>
          )}

          {(mode === 'signup' || mode === 'signin' || mode === 'reset-password') && (
            <div className="auth-form-group">
              <label htmlFor="password" className="auth-form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={`auth-form-input ${errors.password ? 'auth-form-input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'reset-password' ? 'Enter new password' : 'Enter your password'}
                disabled={isSubmitting}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              {errors.password && (
                <span className="auth-field-error">{errors.password}</span>
              )}
            </div>
          )}

          {(mode === 'signup' || mode === 'reset-password') && (
            <div className="auth-form-group">
              <label htmlFor="confirmPassword" className="auth-form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`auth-form-input ${errors.confirmPassword ? 'auth-form-input-error' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="auth-field-error">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isSubmitting}
          >
            {getSubmitButtonText()}
          </button>
        </form>

        <div className="auth-modal-footer">
          {mode === 'signin' && (
            <>
              <button
                type="button"
                className="auth-link-button"
                onClick={() => switchMode('forgot-password')}
                disabled={isSubmitting}
              >
                Forgot Password?
              </button>
              <p className="auth-footer-text">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => switchMode('signup')}
                  disabled={isSubmitting}
                >
                  Sign Up
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p className="auth-footer-text">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => switchMode('signin')}
                disabled={isSubmitting}
              >
                Sign In
              </button>
            </p>
          )}

          {mode === 'forgot-password' && (
            <p className="auth-footer-text">
              Remember your password?{' '}
              <button
                type="button"
                className="auth-link-button"
                onClick={() => switchMode('signin')}
                disabled={isSubmitting}
              >
                Sign In
              </button>
            </p>
          )}

          {mode === 'reset-password' && !successMessage && (
            <p className="auth-footer-text">
              <button
                type="button"
                className="auth-link-button"
                onClick={() => switchMode('signin')}
                disabled={isSubmitting}
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

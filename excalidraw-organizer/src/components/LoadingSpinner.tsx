import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
}) => {
  const spinnerContent = (
    <>
      <div className={`spinner spinner-${size}`}>
        <div className="spinner-circle"></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </>
  );

  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-content">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-container">
      {spinnerContent}
    </div>
  );
};

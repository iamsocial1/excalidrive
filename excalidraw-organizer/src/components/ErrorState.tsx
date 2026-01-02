import React from 'react';
import './ErrorState.css';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  retryLabel = 'Retry',
  icon = '⚠️',
}) => {
  return (
    <div className="error-state">
      <div className="error-state-icon">{icon}</div>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="error-state-retry-button">
          {retryLabel}
        </button>
      )}
    </div>
  );
};

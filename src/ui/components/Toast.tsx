import { useEffect, useState } from 'react';
import './Toast.css';

const EXIT_MS = 180;

export interface ToastProps {
  message: string;
  durationMs?: number;
  onDismiss: () => void;
}

export function Toast({ message, durationMs = 2200, onDismiss }: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const visibleMs = Math.max(EXIT_MS + 50, durationMs - EXIT_MS);
    const leaveTimer = window.setTimeout(() => setLeaving(true), visibleMs);
    const doneTimer = window.setTimeout(onDismiss, visibleMs + EXIT_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [durationMs, onDismiss]);

  function dismiss() {
    setLeaving(true);
    window.setTimeout(onDismiss, EXIT_MS);
  }

  return (
    <div className={`toast${leaving ? ' toast--leaving' : ''}`} role="status">
      <span>{message}</span>
      <button className="toast__close" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

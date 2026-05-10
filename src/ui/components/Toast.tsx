import { useEffect } from 'react';
import './Toast.css';

// SKELETON — fixed-position toast like the "N-Back Level Changed" pill in
// levelschanged.jpeg. UI agent: stack multiple, animate in/out, queue.

export interface ToastProps {
  message: string;
  durationMs?: number;
  onDismiss: () => void;
}

export function Toast({ message, durationMs = 2200, onDismiss }: ToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [durationMs, onDismiss]);

  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button className="toast__close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

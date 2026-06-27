import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// React Context: a way to share state across the component tree without prop drilling.
// Any component inside <ToastProvider> can call useToast() to access addToast().
const ToastContext = createContext(null);

// Counter to generate unique IDs for each toast (avoids key conflicts in the list)
let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]); // array of { id, message, type, leaving }

  // addToast — creates a new toast and schedules its removal.
  // useCallback prevents recreating this function on every render (performance).
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId; // unique id for this toast
    setToasts(prev => [...prev, { id, message, type }]);

    // After 'duration' ms, start the CSS leave animation
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      // After the animation completes (200ms), remove the toast from the DOM
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 200);
    }, duration);

    return id; // caller can use this id to dismiss the toast early if needed
  }, []);

  // removeToast — immediately starts the leave animation and removes the toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 200);
  }, []);

  return (
    // Provide the addToast function to all descendant components
    <ToastContext.Provider value={addToast}>
      {children}

      {/* Toast container — fixed position, renders above all other content */}
      {/* role="status" + aria-live="polite" announces toasts to screen readers */}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.leaving ? 'leaving' : ''}`}>
            {/* Colored icon based on toast type */}
            <div className={`toast-icon ${t.type}`}>
              {t.type === 'success' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              )}
              {t.type === 'error' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              )}
              {t.type === 'info' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              )}
            </div>
            <span className="toast-message">{t.message}</span>
            {/* Manual dismiss button */}
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Custom hook: returns the addToast function for use in any component.
// Throws a helpful error if called outside the provider (common mistake during development).
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

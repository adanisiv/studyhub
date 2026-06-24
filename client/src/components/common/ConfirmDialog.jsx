import React, { useEffect, useRef, createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, title = 'Are you sure?') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ title, message });
    });
  }, []);

  const handleClose = (result) => {
    setState(null);
    if (resolveRef.current) resolveRef.current(result);
  };

  useEffect(() => {
    if (!state) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="confirm-overlay" onClick={() => handleClose(false)} role="dialog" aria-modal="true" aria-label={state.title}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">{state.title}</div>
            <div className="confirm-message">{state.message}</div>
            <div className="confirm-actions">
              <button className="btn btn-secondary btn-small" onClick={() => handleClose(false)}>Cancel</button>
              <button className="btn btn-danger btn-small" onClick={() => handleClose(true)} autoFocus>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

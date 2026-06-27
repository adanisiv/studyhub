import React, { useEffect, useRef, createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  // state holds the current dialog's { title, message }, or null if no dialog is open
  const [state, setState] = useState(null);

  // useRef stores the Promise's resolve function.
  // Using a ref (not state) because updating it should NOT trigger a re-render.
  const resolveRef = useRef(null);

  // confirm() — opens the dialog and returns a Promise.
  // The Promise is pending until the user clicks Confirm or Cancel.
  const confirm = useCallback((message, title = 'Are you sure?') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve; // save the resolve function for later
      setState({ title, message }); // render the dialog
    });
  }, []);

  // handleClose() — called by both buttons and the Escape key.
  // Resolves the pending Promise and closes the dialog.
  const handleClose = (result) => {
    setState(null);                              // close the dialog
    if (resolveRef.current) resolveRef.current(result); // resolve Promise with true or false
  };
  useEffect(() => {
    if (!state) return; // only add listener when dialog is open
    const handler = (e) => { if (e.key === 'Escape') handleClose(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler); // cleanup
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* Modal dialog — only rendered when state is not null */}
      {state && (
        // Clicking the overlay (backdrop) cancels the dialog
        <div
          className="confirm-overlay"
          onClick={() => handleClose(false)}
          role="dialog"
          aria-modal="true"
          aria-label={state.title}
        >
          {/* stopPropagation prevents clicks inside the dialog from bubbling to the overlay */}
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">{state.title}</div>
            <div className="confirm-message">{state.message}</div>
            <div className="confirm-actions">
              <button className="btn btn-secondary btn-small" onClick={() => handleClose(false)}>
                Cancel
              </button>
              {/* autoFocus on Confirm button so pressing Enter confirms immediately */}
              <button className="btn btn-danger btn-small" onClick={() => handleClose(true)} autoFocus>
                Confirm
              </button>
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

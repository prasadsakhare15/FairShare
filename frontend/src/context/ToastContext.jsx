import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-600 dark:bg-red-700 text-white'
              : 'bg-green-600 dark:bg-green-700 text-white'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

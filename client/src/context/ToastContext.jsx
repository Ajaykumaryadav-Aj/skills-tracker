import { useState, useCallback, useMemo } from 'react'
import Toast from '../components/Toast'

import { ToastContext } from './toastContextValue'
export { ToastContext }

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const closeToast = useCallback(() => {
    setToast({ message: '', type: 'success' })
  }, [])

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />
    </ToastContext.Provider>
  )
}

import { useState } from 'react';

export const useNotifications = () => {
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: '', // 'success' or 'error'
    title: '',
    message: ''
  });

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  // Notification helpers
  const showNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
  };

  const hideNotification = () => {
    setNotification({
      show: false,
      type: '',
      title: '',
      message: ''
    });
  };

  // Confirmation dialog helpers
  const showConfirmDialog = (title, message, onConfirm, onCancel = null) => {
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm,
      onCancel,
    });
  };

  const hideConfirmDialog = () => {
    setConfirmDialog({
      show: false,
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null,
    });
  };

  // Success helpers
  const showSuccess = (message, title = 'Success') => {
    showNotification('success', title, message);
  };

  // Error helpers
  const showError = (message, title = 'Error') => {
    showNotification('error', title, message);
  };

  return {
    // State
    notification,
    confirmDialog,
    
    // Notification functions
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    
    // Confirmation functions
    showConfirmDialog,
    hideConfirmDialog
  };
};

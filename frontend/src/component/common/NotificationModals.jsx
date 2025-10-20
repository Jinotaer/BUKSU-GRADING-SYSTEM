import React from 'react';
import { 
  IconX, 
  IconAlertCircle, 
  IconCircleCheck 
} from "@tabler/icons-react";

export const NotificationModal = ({ isOpen, onClose, type, title, message }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const buttonColor = isSuccess ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${bgColor} mb-4`}>
            {isSuccess ? (
              <IconCircleCheck className={iconColor} size={24} />
            ) : (
              <IconX className={iconColor} size={24} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full text-white px-4 py-2 rounded-lg transition-colors ${buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmationModal = ({ isOpen, onClose, title, message, onConfirm }) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      onClose(); // Close the modal first
      await onConfirm(); // Then execute the async callback
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
            <IconAlertCircle className="text-red-500" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationProvider = ({ children, notifications }) => {
  const { notification, confirmDialog, hideNotification, hideConfirmDialog } = notifications;

  return (
    <>
      {children}
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.show}
        onClose={hideNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDialog.show}
        onClose={hideConfirmDialog}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
      />
    </>
  );
};
import React, { useState, useEffect } from "react";
import { authenticatedFetch } from "../../../../utils/auth";
import {
  IconCalendar,
  IconCheck,
  IconX,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";

export function GoogleCalendarCard() {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    connectedAt: null,
    loading: true,
  });
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    checkConnectionStatus();
    
    // Check for OAuth callback result
    const urlParams = new URLSearchParams(window.location.search);
    const googleCalendar = urlParams.get('googleCalendar');
    
    if (googleCalendar === 'connected') {
      showAlert('success', 'Google Calendar connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh connection status
      setTimeout(() => checkConnectionStatus(), 500);
    } else if (googleCalendar === 'error') {
      showAlert('error', 'Failed to connect Google Calendar. Please try again.');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await authenticatedFetch(
        "http://localhost:5000/api/google-calendar/status"
      );

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus({
          connected: data.connected,
          connectedAt: data.connectedAt,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      setConnectionStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const handleConnect = async () => {
    setConnecting(true);

    try {
      const response = await authenticatedFetch(
        "http://localhost:5000/api/google-calendar/auth-url"
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.authUrl) {
          // Redirect to Google OAuth page
          window.location.href = data.authUrl;
        }
      } else {
        showAlert("error", "Failed to get authorization URL");
        setConnecting(false);
      }
    } catch (error) {
      console.error("Error connecting Google Calendar:", error);
      showAlert("error", "Failed to connect Google Calendar");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disconnect Google Calendar? This will not delete past synced events, but future schedules won't be synced automatically."
      )
    ) {
      return;
    }

    setDisconnecting(true);

    try {
      const response = await authenticatedFetch(
        "http://localhost:5000/api/google-calendar/disconnect",
        {
          method: "POST",
        }
      );

      if (response.ok) {
        showAlert("success", "Google Calendar disconnected successfully");
        setConnectionStatus({
          connected: false,
          connectedAt: null,
          loading: false,
        });
      } else {
        showAlert("error", "Failed to disconnect Google Calendar");
      }
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      showAlert("error", "Failed to disconnect Google Calendar");
    } finally {
      setDisconnecting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (connectionStatus.loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <IconRefresh className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {alert.show && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
            alert.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <IconAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{alert.message}</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              connectionStatus.connected
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <IconCalendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Google Calendar Integration
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {connectionStatus.connected ? (
                <>
                  <IconCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <IconX className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500 font-medium">
                    Not Connected
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {connectionStatus.connected ? (
            <>
              Your Google Calendar is connected. When you create schedules with
              "Sync to Google Calendar" enabled, they will automatically appear
              in your personal Google Calendar with reminders.
            </>
          ) : (
            <>
              Connect your Google Calendar to automatically sync your teaching
              schedules. Events will appear in your personal calendar with
              automatic reminders.
            </>
          )}
        </p>

        {connectionStatus.connected && connectionStatus.connectedAt && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
              Connected Since
            </p>
            <p className="text-sm text-gray-900">
              {formatDate(connectionStatus.connectedAt)}
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Features:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <IconCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                Automatic sync of schedules to your Google Calendar
              </span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Email reminders 1 day before events</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Pop-up notifications 1 hour before</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Color-coded events by type (Quiz, Exam, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Updates and deletions sync automatically</span>
            </li>
          </ul>
        </div>

        <div className="pt-4">
          {connectionStatus.connected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {disconnecting ? (
                <>
                  <IconRefresh className="w-4 h-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <IconX className="w-4 h-4" />
                  Disconnect Google Calendar
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <IconRefresh className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <IconCalendar className="w-4 h-4" />
                  Connect Google Calendar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

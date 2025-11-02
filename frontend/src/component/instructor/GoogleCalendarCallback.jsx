import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";
import { IconCheck, IconX, IconLoader } from "@tabler/icons-react";

export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing"); // processing, success, error

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      if (!code) {
        setStatus("error");
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      try {
        const response = await authenticatedFetch(
          `http://localhost:5000/api/google-calendar/callback?code=${code}&state=${state}`
        );

        if (response.ok) {
          setStatus("success");
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          setStatus("error");
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      } catch (error) {
        console.error("Error handling callback:", error);
        setStatus("error");
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <IconLoader className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connecting...
            </h2>
            <p className="text-gray-600">
              Please wait while we connect your Google Calendar.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <IconCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-600">
              Your Google Calendar has been connected. This window will close
              automatically.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <IconX className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600">
              Failed to connect Google Calendar. Please try again. This window
              will close automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

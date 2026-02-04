import React, { useState, useEffect } from "react";
import { NavbarSimple } from "./adminsidebar";
import adminAuth from "../../utils/adminAuth";
import {
  AlertMessage,
  PageHeader,
  LoadingState,
  ProfileCard,
  PersonalInfoCard,
  AccountInfoCard,
  ChangePasswordCard,
} from "./ui/profile";

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Removed editForm state since admin profile is predefined

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Fetch admin profile
  const fetchProfile = async () => {
    try {
      // Check if admin is logged in
      if (!adminAuth.isLoggedIn()) {
        showAlert("error", "You are not logged in. Please login first.");
        // Redirect to admin login
        window.location.href = '/admin/login';
        return;
      }

      const profileData = await adminAuth.getProfile();
      setProfile(profileData);
      // Removed editForm initialization since admin profile cannot be edited
    } catch (error) {
      console.error("Error fetching profile:", error);
      showAlert("error", error.message || "Failed to fetch profile");
      
      // If it's an authentication error, redirect to login
      if (error.message?.includes("token") || error.message?.includes("access")) {
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setPasswordError("");
    setPasswordSuccess("");
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    setPasswordLoading(true);

    try {
      await adminAuth.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(""), 5000);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "green";
      case "Inactive":
        return "red";
      default:
        return "gray";
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <AlertMessage
          alert={alert}
          onClose={() => setAlert({ show: false, type: "", message: "" })}
        />

        <PageHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProfileCard 
            profile={profile} 
            getStatusColor={getStatusColor}
          />

          {/* Information Cards */}
          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard profile={profile} />
            <AccountInfoCard profile={profile} formatDate={formatDate} />
            
            {/* Change Password Card */}
            <ChangePasswordCard
              passwordForm={passwordForm}
              passwordLoading={passwordLoading}
              passwordError={passwordError}
              passwordSuccess={passwordSuccess}
              onSubmit={handlePasswordChange}
              onChange={setPasswordForm}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

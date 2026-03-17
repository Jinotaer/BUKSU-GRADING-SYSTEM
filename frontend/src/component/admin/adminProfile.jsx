import React, { useState, useEffect } from "react";
import { NavbarSimple } from "./adminsidebar";
import adminAuth from "../../utils/adminAuth";
import { getFreshCachedJson } from "../../lib/apiCache";
import { getAdminPasswordValidationMessage } from "../../utils/adminPasswordValidation";
import {
  AlertMessage,
  PageHeader,
  LoadingState,
  ProfileCard,
  PersonalInfoCard,
  AccountInfoCard,
  ChangePasswordCard,
  EditProfileModal,
} from "./ui/profile";

export default function AdminProfile() {
  const namePattern = /^[A-Za-z ]+$/;

  const cachedProfile =
    getFreshCachedJson("http://localhost:5000/api/admin/profile")?.admin || null;
  const [profile, setProfile] = useState(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: cachedProfile?.firstName || "",
    lastName: cachedProfile?.lastName || "",
    email: cachedProfile?.email || "",
  });

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
        window.location.href = "/admin/admin-login";
        return;
      }

      const profileData = await adminAuth.getProfile();
      setProfile(profileData);
      setEditForm({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      showAlert("error", error.message || "Failed to fetch profile");
      
      // If it's an authentication error, redirect to login
      if (error.message?.includes("token") || error.message?.includes("access")) {
        setTimeout(() => {
          window.location.href = "/admin/admin-login";
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

  const openEditModal = () => {
    setEditForm({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || "",
    });
    setEditModalOpened(true);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    const sanitizedForm = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      email: editForm.email.trim().toLowerCase(),
    };

    if (!sanitizedForm.firstName) {
      showAlert("error", "First name is required");
      return;
    }

    if (!namePattern.test(sanitizedForm.firstName)) {
      showAlert("error", "First name must contain only letters and spaces");
      return;
    }

    if (!sanitizedForm.lastName) {
      showAlert("error", "Last name is required");
      return;
    }

    if (!namePattern.test(sanitizedForm.lastName)) {
      showAlert("error", "Last name must contain only letters and spaces");
      return;
    }

    if (!sanitizedForm.email) {
      showAlert("error", "Email is required");
      return;
    }

    setSubmitting(true);

    try {
      const updatedProfile = await adminAuth.updateProfile(sanitizedForm);
      setProfile(updatedProfile);
      setEditForm({
        firstName: updatedProfile.firstName || "",
        lastName: updatedProfile.lastName || "",
        email: updatedProfile.email || "",
      });
      showAlert("success", "Profile updated successfully");
      setEditModalOpened(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showAlert("error", error.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
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

    const passwordValidationMessage =
      getAdminPasswordValidationMessage(passwordForm.newPassword);
    if (passwordValidationMessage) {
      setPasswordError(passwordValidationMessage);
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
        {!editModalOpened && (
          <AlertMessage
            alert={alert}
            onClose={() => setAlert({ show: false, type: "", message: "" })}
          />
        )}

        <PageHeader onEditClick={openEditModal} />

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

        <EditProfileModal
          isOpen={editModalOpened}
          onClose={() => setEditModalOpened(false)}
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleProfileUpdate}
          submitting={submitting}
          alert={alert}
          onAlertClose={() =>
            setAlert({ show: false, type: "", message: "" })
          }
        />
      </div>
    </div>
  );
}

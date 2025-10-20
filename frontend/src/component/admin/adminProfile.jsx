import React, { useState, useEffect } from "react";
import {
  IconUser,
  IconLock,
  IconMail,
  IconCalendar,
  IconShield,
  IconCheck,
  IconX,
  IconEye
} from "@tabler/icons-react";
import { NavbarSimple } from "./adminsidebar";
import adminAuth from "../../utils/adminAuth";
import adminProfileImage from "../../assets/adminprofile.png";

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Removed editModalOpened state since admin profile cannot be edited
  const [passwordModalOpened, setPasswordModalOpened] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Removed editForm state since admin profile is predefined

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

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
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlert("error", "New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showAlert("error", "Password must be at least 8 characters long");
      return;
    }

    setPasswordLoading(true);

    try {
      await adminAuth.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showAlert("success", "Password changed successfully");
      setPasswordModalOpened(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Error changing password:", error);
      showAlert("error", error.message || "Failed to change password");
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
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-center ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {alert.show && (
          <div className={`p-4 mb-6 rounded-md border flex items-center justify-between ${
            alert.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : alert.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            <div className="flex items-center gap-2">
              {alert.type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
              <span>{alert.message}</span>
            </div>
            <button 
              onClick={() => setAlert({ show: false, type: "", message: "" })}
              className="text-gray-500 hover:text-gray-700"
            >
              <IconX size={16} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold font-outfit text-gray-800">Admin Profile</h1>
          <div className="flex gap-3">
            {/* Removed Edit Profile button since admin profile is predefined */}
            {/* <button
              onClick={() => setPasswordModalOpened(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium transition-colors"
            >
              <IconLock size={16} />
              Change Password
            </button> */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-30 h-30 rounded-full bg-buksu-primary flex items-center justify-center overflow-hidden">
                  <img 
                    src={adminProfileImage} 
                    alt="Admin Profile" 
                    className="w-full h-full object-cover"
                  />
                  {/* <IconUser size={60} className="text-buksu-primary" /> */}
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold font-outfit text-gray-800">{profile?.fullName}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {profile?.email}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-3 ${
                    getStatusColor(profile?.status) === 'green' 
                      ? 'bg-green-100 text-green-800' 
                      : getStatusColor(profile?.status) === 'red'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
              <h3 className="text-lg font-semibold mb-4 font-outfit text-gray-700">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <IconUser size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      First Name
                    </p>
                    <p className="font-medium text-gray-800">{profile?.firstName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconUser size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Last Name
                    </p>
                    <p className="font-medium text-gray-800">{profile?.lastName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconMail size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Email Address
                    </p>
                    <p className="font-medium text-gray-800">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconShield size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Role
                    </p>
                    <p className="font-medium text-gray-800">{profile?.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
              <h3 className="text-lg font-semibold mb-4 font-outfit text-gray-700">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <IconCalendar size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Account Created
                    </p>
                    <p className="font-medium text-gray-800">{formatDate(profile?.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconEye size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Last Login
                    </p>
                    <p className="font-medium text-gray-800">{formatDate(profile?.lastLogin)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Removed Edit Profile Modal since admin profile is predefined and cannot be edited */}

        {/* Change Password Modal */}
        {passwordModalOpened && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordModalOpened(false);
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: ""
                        });
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={passwordLoading}
                      className="px-4 py-2 bg-buksu-primary hover:bg-buksu-secondary disabled:bg-blue-400 text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {passwordLoading && <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>}
                      Change Password
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  IconUser,
  IconEdit,
  IconMail,
  IconCalendar,
  IconShield,
  IconCheck,
  IconX,
  IconEye,
  IconSchool,
  IconBuilding,
  IconDeviceFloppy,
  IconCamera
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";

export default function InstructorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Edit profile form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    college: "",
    department: ""
  });

  // Fetch instructor profile
  const fetchProfile = async () => {
    try {
      const response = await authenticatedFetch("http://localhost:5000/api/instructor/profile");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.instructor);
          setEditForm({
            fullName: data.instructor.fullName || "",
            college: data.instructor.college || "",
            department: data.instructor.department || ""
          });
        } else {
          showAlert("error", data.message || "Failed to fetch profile");
        }
      } else {
        showAlert("error", "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showAlert("error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!editForm.fullName.trim()) {
      showAlert("error", "Full name is required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authenticatedFetch("http://localhost:5000/api/instructor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.instructor);
        showAlert("success", "Profile updated successfully");
        setEditModalOpened(false);
      } else {
        showAlert("error", data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showAlert("error", "Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Get Google profile picture from institutional email
  const getGoogleProfilePicture = (email) => {
    if (!email) return null;
    
    // Google's profile picture API using email
    // This works for Google Workspace accounts (institutional emails)
    return `https://lh3.googleusercontent.com/a/default-user=s96-c?email=${encodeURIComponent(email)}`;
  };

  // Fallback function for profile picture
  const handleImageError = (e) => {
    // If Google profile picture fails, use a default avatar
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
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
        <InstructorSidebar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-center ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {/* Alert Messages */}
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

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-4xl font-bold">
            Instructor Profile
          </h1>
          <button
            onClick={() => setEditModalOpened(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            <IconEdit size={16} />
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-blue-100">
                  {/* Google Profile Picture */}
                  <img 
                    src={getGoogleProfilePicture(profile?.email)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                  {/* Fallback Icon */}
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center" style={{ display: 'none' }}>
                    <IconUser size={48} className="text-white" />
                  </div>
                  {/* Google Badge */}
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                    <IconCamera size={12} className="text-gray-500" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold font-outfit text-gray-800">
                    {profile?.fullName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {profile?.email}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-3 ${
                    getStatusColor(profile?.status) === 'green' 
                      ? 'bg-green-100 text-green-800' 
                      : getStatusColor(profile?.status) === 'red'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.status}
                  </span>
                </div>
                <div className="w-full mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 text-center">
                    📸 Profile picture from Google Workspace
                  </p>
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
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-800">
                      {profile?.fullName || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconMail size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-800">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconSchool size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">College</p>
                    <p className="font-medium text-gray-800">
                      {profile?.college || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconBuilding size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium text-gray-800">
                      {profile?.department || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconShield size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
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
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="font-medium text-gray-800">
                      {formatDate(profile?.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconEye size={20} className="text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="font-medium text-gray-800">
                      {formatDate(profile?.lastLogin)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            {(profile?.college || profile?.department) && (
              <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <h3 className="text-lg font-semibold mb-4 font-outfit text-gray-700">
                  Academic Information
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IconSchool className="text-blue-600" size={20} />
                      <span className="font-medium text-blue-800">Institution</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Bukidnon State University
                    </p>
                  </div>
                  {profile?.college && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconBuilding className="text-green-600" size={20} />
                        <span className="font-medium text-green-800">College</span>
                      </div>
                      <p className="text-sm text-green-700">{profile.college}</p>
                    </div>
                  )}
                  {profile?.department && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconBuilding className="text-purple-600" size={20} />
                        <span className="font-medium text-purple-800">Department</span>
                      </div>
                      <p className="text-sm text-purple-700">{profile.department}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {editModalOpened && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>
                <button
                  onClick={() => setEditModalOpened(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <IconX size={20} />
                </button>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={editForm.fullName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      College
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., College of Information and Computing Sciences"
                      value={editForm.college}
                      onChange={(e) =>
                        setEditForm({ ...editForm, college: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Computer Science Department"
                      value={editForm.department}
                      onChange={(e) =>
                        setEditForm({ ...editForm, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600">
                      💡 Your email and profile picture are managed through your Google Workspace account and cannot be changed here.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditModalOpened(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <IconDeviceFloppy size={16} />
                          Save Changes
                        </>
                      )}
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

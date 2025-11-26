import React, { useState, useEffect } from "react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import {
  Alert,
  PageHeader,
  ProfileCard,
  PersonalInfoCard,
  AccountInfoCard,
  AcademicInfoCard,
  EditProfileModal,
  LoadingSpinner,
  GoogleCalendarCard,
} from "./ui/profile";

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

  // Open edit modal and refresh form data
  const openEditModal = () => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || "",
        college: profile.college || "",
        department: profile.department || ""
      });
    }
    setEditModalOpened(true);
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-center ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <Alert
          show={alert.show}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: "", message: "" })}
        />

        <PageHeader onEditClick={openEditModal} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProfileCard profile={profile} />

          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard profile={profile} />
            <AccountInfoCard profile={profile} />
            <AcademicInfoCard profile={profile} />
            <GoogleCalendarCard />
          </div>
        </div>

        <EditProfileModal
          isOpen={editModalOpened}
          editForm={editForm}
          submitting={submitting}
          onClose={() => setEditModalOpened(false)}
          onSubmit={handleProfileUpdate}
          onChange={setEditForm}
        />
      </div>
    </div>
  );
}

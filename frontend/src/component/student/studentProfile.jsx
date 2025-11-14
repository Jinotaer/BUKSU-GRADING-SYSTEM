import React, { useState, useEffect } from "react";
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from "../../utils/auth";
import {
  ProfileCard,
  PersonalInfoCard,
  AcademicInfoCard,
  AccountInfoCard,
  InstitutionInfoCard,
  EditProfileModal,
  AlertMessage,
  ProfileHeader,
  LoadingState,
} from "./ui/profile";
import { 
  getGoogleProfilePicture, 
  handleImageError, 
  formatDate, 
  getStatusColor 
} from "./ui/profile/profileUtils";


export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Edit profile form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    college: "",
    course: "",
    yearLevel: ""
  });

  // Fetch student profile
  const fetchProfile = async () => {
    try {
      const response = await authenticatedFetch("http://localhost:5000/api/student/profile");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.student);
          setEditForm({
            fullName: data.student.fullName || "",
            college: data.student.college || "",
            course: data.student.course || "",
            yearLevel: data.student.yearLevel || ""
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
      const response = await authenticatedFetch("http://localhost:5000/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.student);
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

        <ProfileHeader onEditClick={() => setEditModalOpened(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ProfileCard 
              profile={profile}
              getGoogleProfilePicture={getGoogleProfilePicture}
              handleImageError={handleImageError}
              getStatusColor={getStatusColor}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard profile={profile} />
            <AcademicInfoCard profile={profile} />
            <AccountInfoCard profile={profile} formatDate={formatDate} />
            <InstitutionInfoCard profile={profile} />
          </div>
        </div>

        <EditProfileModal
          isOpen={editModalOpened}
          onClose={() => setEditModalOpened(false)}
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleProfileUpdate}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
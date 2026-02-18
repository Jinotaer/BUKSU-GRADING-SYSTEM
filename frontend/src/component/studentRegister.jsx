import buksuLogo from "../assets/buksu-logo-D6kBo6NY.png";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  RegistrationHeader,
  FormField,
  SelectField,
  MessageAlert,
  SubmitButton,
  EmailIcon,
  StudentIdIcon,
  UserIcon,
  CollegeIcon,
  CourseIcon,
  YearLevelIcon,
} from "./ui/studentRegister";
import { getCoursesByCollege } from "./ui/studentRegister/coursesData";

export function StudentRegister() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [studid, setStudid] = useState("");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [courseOptions, setCourseOptions] = useState([]);

  const collegeOptions = [
    { value: "College of Education", label: "College of Education" },
    { value: "College of Public Administration", label: "College of Public Administration" },
    { value: "College of Nursing", label: "College of Nursing" },
    { value: "College of Business", label: "College of Business" },
    { value: "College of Technologies", label: "College of Technologies" },
    { value: "College of Arts and Science", label: "College of Arts and Science" },
    { value: "College of Law", label: "College of Law" },
  ];

  // Update course options when college changes
  useEffect(() => {
    if (college) {
      const courses = getCoursesByCollege(college);
      setCourseOptions(courses);
      // Reset course selection when college changes
      setCourse("");
    } else {
      setCourseOptions([]);
      setCourse("");
    }
  }, [college]);

  const yearLevelOptions = [
    { value: "1st Year", label: "1st Year" },
    { value: "2nd Year", label: "2nd Year" },
    { value: "3rd Year", label: "3rd Year" },
    { value: "4th Year", label: "4th Year" },
    { value: "5th Year", label: "5th Year" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!studid || !fullName || !college || !course || !yearLevel) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, studid, fullName, college, course, yearLevel }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || "Registration successful! Your account has been automatically approved.");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-15 items-center">
          {/* Header Section - Left Side */}
          <RegistrationHeader
            logoSrc={buksuLogo}
            title="Student Registration"
            subtitle="Complete your profile to get started"
            loginLink="/"
          />
      
          {/* Form Card - Right Side */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <FormField
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  readOnly
                  icon={<EmailIcon />}
                  helperText="Your institutional email"
                />
                
                {/* Student ID and Full Name - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    id="studid"
                    label="Student ID"
                    type="text"
                    placeholder="e.g. 2021-12345"
                    value={studid}
                    onChange={(e) => setStudid(e.target.value)}
                    required
                    icon={<StudentIdIcon />}
                  />
                  
                  <FormField
                    id="fullName"
                    label="Full Name"
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    icon={<UserIcon />}
                  />
                </div>
                
                {/* College Field */}
                <SelectField
                  id="college"
                  label="College"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  options={collegeOptions}
                  placeholder="Select your college"
                  required
                  icon={<CollegeIcon />}
                />
                
                {/* Course Field */}
                {college && courseOptions.length > 0 ? (
                  <SelectField
                    id="course"
                    label="Course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    options={courseOptions}
                    placeholder="Select your course"
                    required
                    icon={<CourseIcon />}
                  />
                ) : (
                  <FormField
                    id="course"
                    label="Course"
                    type="text"
                    placeholder={college ? "No courses available" : "Select a college first"}
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                    readOnly={!college}
                    icon={<CourseIcon />}
                  />
                )}
                
                {/* Year Level Field */}
                <SelectField
                  id="yearLevel"
                  label="Year Level"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  options={yearLevelOptions}
                  placeholder="Select your year level"
                  required
                  icon={<YearLevelIcon />}
                />

                {/* Error Message */}
                <MessageAlert message={error} type="error" />
                
                {/* Success Message */}
                <MessageAlert message={success} type="success" />

                {/* Submit Button */}
                <SubmitButton loading={loading} />
              </form>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
}

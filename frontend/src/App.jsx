import React from "react";
import Login from "./component/login";
import { StudentRegister as Register } from "./component/studentRegister";
import StudentDashboard from "./component/student/studentDashboard";
import StudentGrades from "./component/student/studentGrades";
import StudentSubjects from "./component/student/studentSubjects";
import ClassGrade from "./component/student/classGrade";
import AdminLogin from "./component/adminLogin";
import AdminDashboard from "./component/admin/adminDashboard";
import AdminProfile from "./component/admin/adminProfile";
import InstructorManagement from "./component/admin/instructorManagement";
import StudentManagement from "./component/admin/studentManagement";
import AllUsers from "./component/admin/alluserManagement";
import Semester from "./component/admin/semester";
import Subject from "./component/admin/subjects";
import SectionManagement from "./component/admin/sectionManagement";
import ViewInviteStudentPage from "./component/admin/ViewInviteStudentPage";
import StudentProfile from "./component/student/studentProfile";
import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./component/ProtectedRoute";
import InstructorDashboard from "./component/instructor/instructorDashboard";
import MySections from "./component/instructor/Mysections";
import GradeManagement from "./component/instructor/gradeManagement";
import SemesterView from "./component/instructor/semesterView";
import InstructorProfile from "./component/instructor/instructorProfile";
import SectionsStudent from "./component/instructor/students";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/studentRegister" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" />} />
      <Route path="/adminLogin" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="Admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute role="Admin">
            <AdminProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/instructors"
        element={
          <ProtectedRoute role="Admin">
            <InstructorManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute role="Admin">
            <StudentManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/all-users"
        element={
          <ProtectedRoute role="Admin">
            <AllUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/semestral-period"
        element={
          <ProtectedRoute role="Admin">
            <Semester />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subjects"
        element={
          <ProtectedRoute role="Admin">
            <Subject />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sections"
        element={
          <ProtectedRoute role="Admin">
            <SectionManagement />
          </ProtectedRoute>
        }
      />
        <Route
        path="/admin/view-invite-student/:sectionId"
        element={
          <ProtectedRoute role="Admin">
            <ViewInviteStudentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
        <Route
        path="/student/grades"
        element={
          <ProtectedRoute role="student">
            <StudentGrades />
          </ProtectedRoute>
        }
      />
       <Route
        path="/student/subjects"
        element={
          <ProtectedRoute role="student">
            <StudentSubjects />
          </ProtectedRoute>
        }
      />
       <Route
        path="/student/subjects/:subjectId/grades"
        element={
          <ProtectedRoute role="student">
            <ClassGrade />
          </ProtectedRoute>
        }
      />
       <Route
        path="/student/profile"
        element={
          <ProtectedRoute role="student">
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor"
        element={
          <ProtectedRoute role="instructor">
            <InstructorDashboard/>
          </ProtectedRoute>
        }
      />
       <Route
        path="/instructor/my-sections"
        element={
          <ProtectedRoute role="instructor">
            <MySections/>
          </ProtectedRoute>
        }
      />
       {/* <Route
        path="/instructor/assigned-subjects"
        element={
          <ProtectedRoute role="instructor">
            <AssignedSubjects/>
          </ProtectedRoute>
        }
      /> */}
       <Route
        path="/instructor/grades"
        element={
          <ProtectedRoute role="instructor">
            <GradeManagement/>
          </ProtectedRoute>
        }
      />
       <Route
        path="/instructor/semester-view"
        element={
          <ProtectedRoute role="instructor">
            <SemesterView/>
          </ProtectedRoute>
        }
      />
       <Route
        path="/instructor/students"
        element={
          <ProtectedRoute role="instructor">
            <SectionsStudent/>
          </ProtectedRoute>
        }
      />
       <Route
        path="/instructor/profile"
        element={
          <ProtectedRoute role="instructor">
            <InstructorProfile/>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

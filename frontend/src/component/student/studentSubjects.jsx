import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from '../../utils/auth';
const academicYears = [
  { value: '2023-2024', label: '2023-2024' },
  { value: '2024-2025', label: '2024-2025' },
  { value: '2025-2026', label: '2025-2026' },
];

const semesters = [
  { value: '1st Semester', label: '1st Semester' },
  { value: '2nd Semester', label: '2nd Semester' },
  { value: 'Summer', label: 'Summer' },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(academicYears[0].value);
  const [selectedSemester, setSelectedSemester] = useState(semesters[0].value);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTermFromSemester = (semester) => {
    switch (semester) {
      case '1st Semester': return '1st';
      case '2nd Semester': return '2nd';
      case 'Summer': return 'Summer';
      default: return '1st';
    }
  };

  const fetchStudentSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      
      // First try to get all sections for debugging
      const allUrl = `http://localhost:5000/api/student/sections`;
      console.log('Fetching all sections from:', allUrl);
      
      const allResponse = await authenticatedFetch(allUrl);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        console.log('All available sections:', allData);
      }
      
      // Now fetch with filters
      const url = `http://localhost:5000/api/student/sections?schoolYear=${encodeURIComponent(selectedYear)}&term=${getTermFromSemester(selectedSemester)}`;
      console.log('Fetching filtered sections from:', url);
      console.log('Filters - schoolYear:', selectedYear, 'term:', getTermFromSemester(selectedSemester));
      
      const response = await authenticatedFetch(url);
      console.log('Raw Response:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse the JSON response
      const data = await response.json();
      console.log('Parsed Response:', data);
      
      if (data.success) {
        setSections(data.sections || []);
        console.log('Sections loaded:', data.sections);
      } else {
        setError(data.message || 'Failed to fetch sections');
        console.error('API Error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    fetchStudentSections();
  }, [fetchStudentSections]);

  const filteredClasses = sections.filter((section) => {
    return (
      section.subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.sectionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSubjectClick = (section) => {
    navigate(`/student/subjects/${section.subject._id}/grades`);
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <NavbarSimple />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your subjects...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <NavbarSimple />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchStudentSections}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
       <NavbarSimple />
      <h3 className="pt-10 text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-6 sm:mb-8 font-outfit max-[880px]:mt-10">
        Student Dashboard
      </h3>
      
      {/* Filters Section */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-5">
        <input
          type="text"
          placeholder="Search Class"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-buksu-primary focus:border-transparent"
        />
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Academic Year
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-buksu-primary focus:border-transparent"
            >
              {academicYears.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Semester
            </span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-buksu-primary focus:border-transparent"
            >
              {semesters.map((semester) => (
                <option key={semester.value} value={semester.value}>
                  {semester.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((section) => (
          <div 
            key={section._id} 
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
            onClick={() => handleSubjectClick(section)}
          >
            {/* Image Section */}
            <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-3xl font-bold mb-2">
                  {section.subject.subjectCode}
                </div>
                <div className="text-sm opacity-90">
                  {section.sectionName}
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {section.subject.subjectName}
              </h3>
              
              <p className="text-gray-600 font-medium text-sm mb-3">
                {section.subject.subjectCode} - {section.sectionName}
              </p>
              
              <div className="space-y-1 mb-4">
                <p className="text-gray-500 text-sm">
                  {section.term} Semester
                </p>
                
                <p className="text-gray-500 text-sm">
                  A.Y. {section.schoolYear}
                </p>
                
                <p className="text-gray-500 text-sm">
                  {section.subject.units} {section.subject.units === 1 ? 'Unit' : 'Units'}
                </p>
              </div>
              
              <p className="text-gray-900 font-semibold text-sm">
                {section.instructor?.fullName || 'Instructor TBA'}
              </p>
              
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {section.subject.college}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredClasses.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <p className="text-gray-500 text-lg mb-2">
            No subjects found for the selected criteria
          </p>
          <p className="text-gray-400 text-sm">
            Contact your admin if you think there should be subjects assigned to you.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

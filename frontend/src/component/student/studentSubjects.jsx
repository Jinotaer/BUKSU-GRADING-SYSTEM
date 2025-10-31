import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from '../../utils/auth';
import { IconArchive, IconX, IconAlertCircle } from '@tabler/icons-react';
import { NotificationModal } from '../common/NotificationModals';
const academicYears = [
  { value: '2024-2025', label: '2024-2025' },
  { value: '2025-2026', label: '2025-2026' },
  { value: '2023-2024', label: '2023-2024' },
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
  
  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [sectionToArchive, setSectionToArchive] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: ''
  });

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
      setError(null);
      
      // First try to get all sections without filters to see what's available
      console.log('Fetching all student sections...');
      const allResponse = await authenticatedFetch('http://localhost:5000/api/student/sections');
      
      if (!allResponse.ok) {
        if (allResponse.status === 401) {
          setError('Authentication required. Please log in again.');
          return;
        }
        throw new Error(`HTTP error! status: ${allResponse.status}`);
      }
      
      const allData = await allResponse.json();
      console.log('All sections response:', allData);
      
      if (!allData.success) {
        setError(allData.message || 'Failed to fetch sections');
        return;
      }
      
      const allSections = allData.sections || [];
      console.log(`Found ${allSections.length} total sections`);
      
      // Filter sections by selected year and semester
      const filteredSections = allSections.filter(section => {
        const matchesYear = !selectedYear || section.schoolYear === selectedYear;
        const matchesSemester = !selectedSemester || section.term === getTermFromSemester(selectedSemester);
        return matchesYear && matchesSemester;
      });
      
      console.log(`Filtered to ${filteredSections.length} sections for ${selectedYear} ${getTermFromSemester(selectedSemester)}`);
      setSections(filteredSections);
      
      if (filteredSections.length === 0 && allSections.length > 0) {
        console.log('No sections match the current filters. Available sections:', allSections.map(s => ({
          schoolYear: s.schoolYear,
          term: s.term,
          subject: s.subject?.subjectCode
        })));
      }
      
    } catch (error) {
      console.error('Error fetching sections:', error);
      setError(`Failed to load sections: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    fetchStudentSections();
  }, [fetchStudentSections]);

  const filteredClasses = sections.filter((section) => {
    if (!section || !section.subject) return false;
    
    const subjectName = section.subject.subjectName || '';
    const subjectCode = section.subject.subjectCode || '';
    const sectionName = section.sectionName || '';
    
    return (
      subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sectionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSubjectClick = (section) => {
    navigate(`/student/sections/${section._id}/activities`, { 
      state: { 
        section: section,
        subject: section.subject 
      } 
    });
  };

  const handleArchiveClick = (section, e) => {
    e.stopPropagation(); // Prevent card click
    setSectionToArchive(section);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    if (!sectionToArchive) return;

    try {
      setArchiving(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/student/sections/${sectionToArchive._id}/archive`,
        { method: 'PUT' }
      );

      if (res.ok) {
        setNotification({
          show: true,
          type: 'success',
          message: 'Subject archived successfully!'
        });
        setShowArchiveModal(false);
        setSectionToArchive(null);
        // Refresh the sections list
        await fetchStudentSections();
      } else {
        const errorData = await res.json();
        setNotification({
          show: true,
          type: 'error',
          message: errorData.message || 'Failed to archive subject'
        });
      }
    } catch (error) {
      console.error('Error archiving subject:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Error archiving subject'
      });
    } finally {
      setArchiving(false);
    }
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
                <button
                  onClick={(e) => handleArchiveClick(section, e)}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Archive Subject"
                >
                  <IconArchive className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredClasses.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          {sections.length === 0 ? (
            <div>
              <p className="text-gray-500 text-lg mb-2">
                No subjects assigned
              </p>
              <p className="text-gray-400 text-sm mb-4">
                You are not enrolled in any subjects for the selected academic year and semester.
                <br />
                Contact your instructor or admin to be added to course sections.
              </p>
              <button 
                onClick={fetchStudentSections}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-lg mb-2">
                No subjects match your search
              </p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search term or filter criteria.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && sectionToArchive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <IconAlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                Archive Subject
              </h3>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={archiving}
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to archive this subject?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {sectionToArchive.subject.code} - {sectionToArchive.subject.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Section: {sectionToArchive.name}
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                You can unarchive it later from the Archive Management page.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={archiving}
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                disabled={archiving}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-300 flex items-center"
              >
                <IconArchive className="w-4 h-4 mr-2" />
                {archiving ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.show}
        type={notification.type}
        title={notification.type === 'success' ? 'Success' : 'Error'}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
};

export default StudentDashboard;

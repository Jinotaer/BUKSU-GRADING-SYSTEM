import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from '../../utils/auth';
import { NotificationModal } from '../common/NotificationModals';
import {
  SubjectHeader,
  SubjectFilters,
  SubjectGrid,
  ArchiveModal,
  LoadingState,
  ErrorState,
} from './ui/subjects';
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
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <NavbarSimple />
        <ErrorState error={error} onRetry={fetchStudentSections} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
      <NavbarSimple />
      
      <SubjectHeader />

      <SubjectFilters
        searchTerm={searchTerm}
        selectedYear={selectedYear}
        selectedSemester={selectedSemester}
        academicYears={academicYears}
        semesters={semesters}
        onSearchChange={setSearchTerm}
        onYearChange={setSelectedYear}
        onSemesterChange={setSelectedSemester}
      />

      <SubjectGrid
        filteredClasses={filteredClasses}
        sections={sections}
        loading={loading}
        onSubjectClick={handleSubjectClick}
        onArchiveClick={handleArchiveClick}
        onRefresh={fetchStudentSections}
      />

      <ArchiveModal
        isOpen={showArchiveModal}
        section={sectionToArchive}
        archiving={archiving}
        onConfirm={confirmArchive}
        onClose={() => setShowArchiveModal(false)}
      />

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

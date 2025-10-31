import React, { useState, useEffect } from 'react';
import sampleImage from '../../assets/sample.jpg';
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from '../../utils/auth';
import { IconCalendarEvent, IconClock } from '@tabler/icons-react';
import moment from 'moment';
const academicYears = [
  { value: '2025 - 2026', label: '2025 - 2026' },
  { value: '2024 - 2025', label: '2024 - 2025' },
  { value: '2023 - 2024', label: '2023 - 2024' },
];

const semesters = [
  { value: '1st Semester', label: '1st Semester' },
  { value: '2nd Semester', label: '2nd Semester' },
  { value: 'Summer', label: 'Summer' },
];

const classesData = [
  {
    id: 1,
    title: 'Networking 2',
    code: 'IT 134A - T107',
    semester: '1st Semester',
    academicYear: '2025 - 2026',
    instructor: 'Mr. Petershimd',
    imageUrl: sampleImage, // Update with actual image path
  },
  {
    id: 2,
    title: 'Networking 2',
    code: 'IT 134A - T107',
    semester: '1st Semester',
    academicYear: '2025 - 2026',
    instructor: 'Mr. Petershimd',
    imageUrl: sampleImage,
  },
  {
    id: 3,
    title: 'Networking 2',
    code: 'IT 134A - T107',
    semester: '1st Semester',
    academicYear: '2025 - 2026',
    instructor: 'Mr. Petershimd',
    imageUrl: sampleImage,
  },
  {
    id: 4,
    title: 'Networking 2',
    code: 'IT 134A - T107',
    semester: '1st Semester',
    academicYear: '2025 - 2026',
    instructor: 'Mr. Petershimd',
    imageUrl: sampleImage,
  },
  {
    id: 5,
    title: 'Networking 2',
    code: 'IT 134A - T107',
    semester: '1st Semester',
    academicYear: '2025 - 2026',
    instructor: 'Mr. Petershimd',
    imageUrl: sampleImage,
  },
  {
    id: 6,
    title: 'Networking 2',
    code: 'IT 134A - T107',
    semester: '1st Semester',
    academicYear: '2025 - 2026',
    instructor: 'Mr. Petershimd',
    imageUrl: sampleImage,
  },
];

const StudentDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(academicYears[0].value);
  const [selectedSemester, setSelectedSemester] = useState(semesters[0].value);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);

  useEffect(() => {
    loadUpcomingSchedules();
  }, []);

  const loadUpcomingSchedules = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:5000/api/schedule/upcoming?limit=3');
      if (response.ok) {
        const data = await response.json();
        setUpcomingSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const eventTypeColors = {
    quiz: 'bg-red-100 text-red-800 border-red-300',
    laboratory: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    exam: 'bg-blue-100 text-blue-800 border-blue-300',
    assignment: 'bg-orange-100 text-orange-800 border-orange-300',
    project: 'bg-green-100 text-green-800 border-green-300',
    other: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const filteredClasses = classesData.filter((cls) => {
    return (
      cls.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      cls.academicYear === selectedYear &&
      cls.semester === selectedSemester
    );
  });

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

      {/* Upcoming Schedule Section */}
      {upcomingSchedules.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <IconCalendarEvent className="w-5 h-5 text-blue-600" />
              Upcoming Events
            </h3>
            <button
              onClick={() => window.location.href = '/student/schedule'}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingSchedules.map((schedule) => (
              <div
                key={schedule._id}
                className={`p-4 rounded-lg border ${eventTypeColors[schedule.eventType]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold uppercase">{schedule.eventType}</span>
                  <IconClock className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{schedule.title}</h4>
                <p className="text-xs mb-1">{schedule.subject.subjectCode}</p>
                <p className="text-xs">{moment(schedule.startDateTime).format('MMM D, h:mm A')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div 
            key={cls.id} 
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
          >
            <div className="h-35">
              <img 
                src={cls.imageUrl} 
                alt={cls.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-4">
              <h4 className="text-gray-800 font-outfit font-bold text-lg mb-2">
                {cls.title}
              </h4>
              
              <p className="text-gray-600 text-sm mb-1">
                {cls.code}
              </p>
              
              <p className="text-gray-500 text-xs mb-1">
                {cls.semester}
              </p>
              
              <p className="text-gray-500 text-xs mb-3">
                A.Y. {cls.academicYear}
              </p>
              
              <p className="text-gray-700 text-sm font-semibold">
                {cls.instructor}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No classes found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

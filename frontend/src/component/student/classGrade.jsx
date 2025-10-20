import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconChevronUp, IconChevronDown, IconArrowLeft } from '@tabler/icons-react';
import { authenticatedFetch } from '../../utils/auth';
import { NavbarSimple } from './studentsidebar';

const ClassGrade = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [activities, setActivities] = useState({
    classStanding: [],
    laboratory: [],
    majorOutput: []
  });
  const [expandedSections, setExpandedSections] = useState({
    classStanding: true,
    laboratory: true,
    majorOutput: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);

  const fetchClassGrades = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/student/subjects/${subjectId}/grades`);
      
      if (response.success) {
        // Group activities by category
        const groupedActivities = {
          classStanding: response.data.activities.filter(activity => activity.category === 'classStanding'),
          laboratory: response.data.activities.filter(activity => activity.category === 'laboratory'),
          majorOutput: response.data.activities.filter(activity => activity.category === 'majorOutput')
        };
        setActivities(groupedActivities);
        setSubjectInfo(response.data.subject);
      } else {
        setError(response.message || 'Failed to fetch grades');
      }
    } catch (error) {
      console.error('Error fetching class grades:', error);
      setError('Failed to load class grades');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchClassGrades();
  }, [fetchClassGrades]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const calculateAverage = (categoryActivities) => {
    if (categoryActivities.length === 0) return 0;
    const totalScore = categoryActivities.reduce((sum, activity) => sum + (activity.score || 0), 0);
    const totalMaxScore = categoryActivities.reduce((sum, activity) => sum + activity.maxScore, 0);
    return totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(2) : 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const CategorySection = ({ title, categoryKey, activities, maxPoints = 150 }) => {
    const isExpanded = expandedSections[categoryKey];
    const average = calculateAverage(activities);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        {/* Category Header */}
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg cursor-pointer"
          onClick={() => toggleSection(categoryKey)}
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold">{maxPoints}</span>
            {isExpanded ? (
              <IconChevronUp className="w-5 h-5" />
            ) : (
              <IconChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Category Content */}
        {isExpanded && (
          <div className="p-0">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div></div>
              <div className="text-center">Submission date</div>
              <div className="text-center">Points</div>
            </div>

            {/* Activities List */}
            <div className="divide-y divide-gray-100">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={activity._id || index} className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-900">
                      {activity.title || 'Activity Name'}
                    </div>
                    <div className="text-center text-gray-600">
                      {activity.submissionDate ? formatDate(activity.submissionDate) : formatDate(activity.dueDate || '2025-08-15')}
                    </div>
                    <div className="text-center font-medium">
                      <span className="text-gray-900">{activity.score || 0}</span>
                      <span className="text-gray-500">/{activity.maxScore || 100}</span>
                    </div>
                  </div>
                ))
              ) : (
                // Placeholder activities when no data
                Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-900">Activity Name</div>
                    <div className="text-center text-gray-600">15 August 2025</div>
                    <div className="text-center font-medium">
                      <span className="text-gray-900">91</span>
                      <span className="text-gray-500">/100</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Average Section */}
            <div className="bg-gray-100 p-4 rounded-b-lg">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">
                  {title} Average
                </div>
                <div></div>
                <div className="text-center">
                  <span className="font-bold text-lg text-purple-600">
                    {Math.round(average * maxPoints / 100)}/{maxPoints}
                  </span>
                  <span className="text-gray-500 ml-2">({average}%)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
      <NavbarSimple />
      
      <div className="space-y-4">
        {/* Back Button and Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/student/subjects')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <IconArrowLeft className="w-4 h-4" />
              <span>Back to Subjects</span>
            </button>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Class Grades</h2>
          {subjectInfo && (
            <div className="mt-2">
              <h3 className="text-lg font-semibold text-purple-600">{subjectInfo.title}</h3>
              <p className="text-gray-600">{subjectInfo.code}</p>
            </div>
          )}
          <p className="text-gray-600 mt-1">View your grades and performance across different activity categories</p>
        </div>

      {/* Grade Categories */}
      <CategorySection 
        title="Class Standing"
        categoryKey="classStanding"
        activities={activities.classStanding}
        maxPoints={150}
      />

      <CategorySection 
        title="Laboratory"
        categoryKey="laboratory"
        activities={activities.laboratory}
        maxPoints={150}
      />

      <CategorySection 
        title="Major Output"
        categoryKey="majorOutput"
        activities={activities.majorOutput}
        maxPoints={150}
      />

      {/* Overall Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Overall Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {calculateAverage([...activities.classStanding, ...activities.laboratory, ...activities.majorOutput])}%
            </div>
            <div className="text-gray-600 text-sm">Overall Average</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {activities.classStanding.length + activities.laboratory.length + activities.majorOutput.length}
            </div>
            <div className="text-gray-600 text-sm">Total Activities</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {[...activities.classStanding, ...activities.laboratory, ...activities.majorOutput]
                .filter(activity => activity.score >= (activity.maxScore * 0.75)).length}
            </div>
            <div className="text-gray-600 text-sm">Above 75%</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ClassGrade;

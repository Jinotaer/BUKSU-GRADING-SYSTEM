import React, { useState, useEffect } from "react";
import { NavbarSimple } from "./studentsidebar";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";
import Pagination from "../common/Pagination";
import {
  ActivityHeader,
  SummaryCardsGrid,
  CategoryCardsList,
  LoadingState,
  ErrorState,
} from "./ui/activities";

export function GradeBreakdown({ title, subtitle = "Detailed Grade Breakdown", onBack, categories = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Flatten all rows from all categories for pagination
  const allRows = React.useMemo(() => {
    return categories.flatMap(category => 
      category.rows.map(row => ({
        ...row,
        categoryName: category.name,
        categoryWeight: category.weightLabel
      }))
    );
  }, [categories]);

  const totalPages = Math.ceil(allRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = allRows.slice(startIndex, endIndex);

  // Group paginated rows back into categories
  const paginatedCategories = React.useMemo(() => {
    const categoryMap = {};
    
    paginatedRows.forEach(row => {
      if (!categoryMap[row.categoryName]) {
        const originalCategory = categories.find(c => c.name === row.categoryName);
        categoryMap[row.categoryName] = {
          name: row.categoryName,
          weightLabel: row.categoryWeight,
          percent: originalCategory?.percent || 0,
          rows: []
        };
      }
      
      // Remove the added properties before adding to rows
      // eslint-disable-next-line no-unused-vars
      const { categoryName, categoryWeight, ...cleanRow } = row;
      categoryMap[row.categoryName].rows.push(cleanRow);
    });
    
    return Object.values(categoryMap);
  }, [paginatedRows, categories]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <NavbarSimple />
      
      <div className="flex-1 ml-0 max-[880px]:ml-0 min-[881px]:ml-65">
        <div className="min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 max-[880px]:pt-20">
            <ActivityHeader 
              onBack={onBack}
              title={title}
              subtitle={subtitle}
            />

            <SummaryCardsGrid categories={categories} />

            <CategoryCardsList categories={paginatedCategories} />

            {allRows.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={allRows.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that fetches real student scores
export default function StudentActivityScores() {
  const { sectionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [section, setSection] = useState(state?.section || null);
  const [categories, setCategories] = useState([]);

  // Helper function to get current student ID
  const getCurrentStudentId = () => {
    // This should get the current logged-in student's ID
    // You might get this from localStorage, context, or decode from token
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user._id;
  };

  // Process activities and scores into categories
  const processCategories = React.useCallback((activities, allScores) => {
    console.log('Processing categories with:', { activities, allScores });
    
    const categoryMap = {
      classStanding: { name: "Class Standing", activities: [], weight: 0 },
      laboratory: { name: "Laboratory", activities: [], weight: 0 },
      majorOutput: { name: "Major Output", activities: [], weight: 0 }
    };

    // Get grading schema weights
    const gradingSchema = section?.gradingSchema || {};
    categoryMap.classStanding.weight = gradingSchema.classStanding || 30;
    categoryMap.laboratory.weight = gradingSchema.laboratory || 30;
    categoryMap.majorOutput.weight = gradingSchema.majorOutput || 40;

    const currentStudentId = getCurrentStudentId();
    console.log('Current student ID:', currentStudentId);

    // Group activities by category
    activities.forEach(activity => {
      const category = activity.category || 'classStanding';
      if (categoryMap[category]) {
        const activityScores = allScores.find(s => s.activityId === activity._id);
        console.log(`Activity ${activity.title} scores:`, activityScores);
        categoryMap[category].activities.push({
          activity,
          scores: activityScores?.scores || []
        });
      }
    });

    // Convert to display format
    const processedCategories = Object.entries(categoryMap).map(([, data]) => {
      const rows = data.activities.map(({ activity, scores }) => {
        console.log(`Processing activity ${activity.title}, scores array:`, scores);
        
        // Since students only get their own score, scores array should have 1 item
        // Backend returns rows: [{ studentId, score, maxScore, ... }]
        const studentScore = scores.length > 0 ? scores[0] : null;
        const score = studentScore?.score ?? 0;
        const maxScore = studentScore?.maxScore ?? activity.maxScore ?? 100;
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        
        console.log(`Score for ${activity.title}:`, { studentScore, score, maxScore, percentage });
        
        return {
          item: activity.title,
          score: `${score}/${maxScore}`,
          percentage: `${percentage.toFixed(1)}%`,
          date: new Date(activity.createdAt).toLocaleDateString()
        };
      });

      // Calculate category average
      const categoryAverage = rows.length > 0 
        ? rows.reduce((sum, row) => sum + parseFloat(row.percentage), 0) / rows.length
        : 0;

      return {
        name: data.name,
        weightLabel: `Weight: ${data.weight}% of final grade`,
        percent: categoryAverage,
        rows
      };
    });

    console.log('Processed categories:', processedCategories);
    setCategories(processedCategories);
  }, [section]);

  // Fetch section activities and scores
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // If we don't have section data from navigation state, fetch it
        if (!section && sectionId) {
          const sectionResponse = await authenticatedFetch(`http://localhost:5000/api/student/sections`);
          if (sectionResponse.ok) {
            const sectionsData = await sectionResponse.json();
            const foundSection = sectionsData.sections?.find(s => s._id === sectionId);
            if (foundSection) {
              setSection(foundSection);
            } else {
              setError('Section not found');
              return;
            }
          }
        }

        // Fetch activities for this section
        const activitiesResponse = await authenticatedFetch(
          `http://localhost:5000/api/instructor/sections/${sectionId}/activities`
        );
        
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          const activities = activitiesData.activities || [];

          // Fetch scores for each activity
          const scoresPromises = activities.map(async (activity) => {
            try {
              const scoresResponse = await authenticatedFetch(
                `http://localhost:5000/api/activityScores/activities/${activity._id}/scores?sectionId=${sectionId}`
              );
              if (scoresResponse.ok) {
                const scoresData = await scoresResponse.json();
                return {
                  activityId: activity._id,
                  activity: activity,
                  scores: scoresData.rows || []
                };
              }
            } catch (err) {
              console.error(`Error fetching scores for activity ${activity._id}:`, err);
            }
            return { activityId: activity._id, activity: activity, scores: [] };
          });

          const allScores = await Promise.all(scoresPromises);

          // Process data into categories
          processCategories(activities, allScores);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load scores');
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) {
      fetchData();
    }
  }, [sectionId, section, processCategories]);

  const handleBack = () => {
    // Check if user came from archive page
    if (state?.fromArchive) {
      navigate('/student/archive');
    } else {
      navigate('/student/subjects');
    }
  };

  if (loading) {
    return <LoadingState message="Loading your scores..." />;
  }

  if (error) {
    return <ErrorState message={error} onBack={handleBack} />;
  }

  const sectionTitle = section 
    ? `${section.subject?.subjectCode} - ${section.subject?.subjectName}`
    : 'Course Scores';

  return (
    <GradeBreakdown
      title={sectionTitle}
      subtitle={`Section ${section?.sectionName || ''} - Detailed Grade Breakdown`}
      onBack={handleBack} 
      categories={categories}
    />
  );
}

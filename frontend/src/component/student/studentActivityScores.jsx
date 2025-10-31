import React, { useState, useEffect } from "react";
import { IconChevronLeft } from "@tabler/icons-react";
import { NavbarSimple } from "./studentsidebar";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";

// Get color scheme based on category name
const getCategoryColors = (name) => {
  const colors = {
    "Class Standing": {
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      badge: "bg-blue-600",
      light: "bg-blue-100",
      hover: "hover:bg-blue-100"
    },
    "Laboratory": {
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      badge: "bg-purple-600",
      light: "bg-purple-100",
      hover: "hover:bg-purple-100"
    },
    "Major Output": {
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      badge: "bg-emerald-600",
      light: "bg-emerald-100",
      hover: "hover:bg-emerald-100"
    }
  };
  return colors[name] || colors["Class Standing"];
};

// Compact percentage with a tiny progress bar (right side of each card header)
function PercentBadge({ value, color }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex flex-col items-end gap-2 min-w-[110px]">
      <span className={`inline-flex items-center justify-center px-4 py-2 text-sm font-bold rounded-lg ${color} text-white shadow-lg`}>
        {pct.toFixed(1)}%
      </span>
      <div className="w-28 h-2.5 rounded-full bg-gray-200 overflow-hidden shadow-inner">
        <div 
          className={`h-full bg-gradient-to-r ${getCategoryColors("").gradient} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}

function CategoryCard({ name, weightLabel, percent, rows = [] }) {
  const colors = getCategoryColors(name);
  
  return (
    <section className={`rounded-2xl border-2 ${colors.border} bg-white shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl`}>
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} px-6 py-5`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
            <p className="text-sm text-white/90">{weightLabel}</p>
          </div>
          <PercentBadge value={percent} color={colors.badge} />
        </div>
      </div>

      {/* Table Content */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`${colors.light} border-b-2 ${colors.border}`}>
                <th className={`font-semibold text-left py-3 px-4 ${colors.text}`}>Activity</th>
                <th className={`font-semibold text-left py-3 px-4 ${colors.text}`}>Score</th>
                <th className={`font-semibold text-left py-3 px-4 ${colors.text}`}>Percentage</th>
                <th className={`font-semibold text-left py-3 px-4 ${colors.text}`}>Date Posted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, idx) => (
                <tr key={idx} className={`${colors.hover} transition-colors duration-150`}>
                  <td className="py-4 px-4 font-medium text-gray-800">{r.item}</td>
                  <td className="py-4 px-4 text-gray-700 font-semibold">{r.score}</td>
                  <td className={`py-4 px-4 font-bold ${colors.text} text-base`}>{r.percentage}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-gray-500">{r.date}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                    No activities posted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// Summary Card Component
function SummaryCard({ title, percentage, weightLabel, icon, bgColor }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
            {weightLabel && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                {weightLabel}
              </span>
            )}
          </div>
        </div>
        <div className={`flex items-center justify-center w-14 h-14 rounded-full ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function GradeBreakdown({ title, subtitle = "Detailed Grade Breakdown", onBack, categories = [] }) {
  // Calculate overall weighted average
  const calculateOverallGrade = () => {
    if (categories.length === 0) return 0;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    categories.forEach(cat => {
      const weight = parseFloat(cat.weightLabel.match(/\d+/)?.[0] || 0);
      totalWeightedScore += (cat.percent * weight) / 100;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalWeightedScore : 0;
  };

  const overallGrade = calculateOverallGrade();
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Student Sidebar */}
      <NavbarSimple />
      
      {/* Main content */}
      <div className="flex-1 ml-0 max-[880px]:ml-0 min-[881px]:ml-65">
        <div className="min-h-screen">
          {/* Content area */}
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 max-[880px]:pt-20">
            {/* Header Section */}
            <div className="mb-8 mt-8">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200 font-medium"
              >
                <IconChevronLeft size={18} /> Back
              </button>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-1">{title}</h1>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Overall Grade Card */}
              <SummaryCard 
                title="Overall (weighted)"
                percentage={overallGrade.toFixed(1)}
                weightLabel="Auto-computed"
                bgColor="bg-gray-700"
                icon={
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              
              {/* Individual Category Cards */}
              {categories.map((cat) => {
                const colors = getCategoryColors(cat.name);
                let IconComponent;
                
                if (cat.name === "Class Standing") {
                  IconComponent = (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  );
                } else if (cat.name === "Laboratory") {
                  IconComponent = (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  );
                } else {
                  IconComponent = (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  );
                }
                
                return (
                  <SummaryCard 
                    key={cat.name}
                    title={cat.name}
                    percentage={cat.percent.toFixed(1)}
                    weightLabel={cat.weightLabel.replace('Weight: ', '').replace(' of final grade', '')}
                    bgColor={colors.badge}
                    icon={IconComponent}
                  />
                );
              })}
            </div>

            {/* Detailed Category Cards */}
            <div className="space-y-8">
              {categories.map((cat) => (
                <CategoryCard 
                  key={cat.name} 
                  name={cat.name} 
                  weightLabel={cat.weightLabel} 
                  percent={cat.percent} 
                  rows={cat.rows} 
                />
              ))}
            </div>
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
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your scores...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Subjects
            </button>
          </div>
        </div>
      </div>
    );
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

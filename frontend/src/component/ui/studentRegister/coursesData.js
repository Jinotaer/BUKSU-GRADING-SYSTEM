// Courses organized by college
export const coursesData = {
  "College of Arts and Science": {
    undergraduate: [
      "Bachelor of Arts in Economics",
      "Bachelor of Arts in English Language",
      "Bachelor of Arts in Philosophy Pre-Law",
      "Bachelor of Arts in Philosophy Teaching Track",
      "Bachelor of Arts in Sociology",
      "Bachelor of Science in Biology Major in Biotechnology",
      "Bachelor of Science in Community Development",
      "Bachelor of Science in Development Communication",
      "Bachelor of Science in Environmental Science major in Environmental Heritage Studies",
      "Bachelor of Science in Mathematics",
    ],
    postgraduate: [
      "Doctor of Philosophy in English Language",
      "Master of Arts in English Language",
      "Master of Arts in Guidance and Counseling",
      "Master of Arts in Sociology",
    ],
  },
  "College of Business": {
    undergraduate: [
      "Bachelor of Science in Accountancy",
      "Bachelor of Science in Business Administration major in Financial Management",
      "Bachelor of Science in Hospitality Management",
    ],
    postgraduate: [
      "Master of Business Administration",
    ],
  },
  "College of Education": {
    undergraduate: [
      "Bachelor of Early Childhood Education",
      "Bachelor of Elementary Education",
      "Bachelor of Physical Education",
      "Bachelor of Secondary Education Major in English",
      "Bachelor of Secondary Education Major in Filipino",
      "Bachelor of Secondary Education Major in Mathematics",
      "Bachelor of Secondary Education Major in Science",
      "Bachelor of Secondary Education Major in Social Studies",
    ],
    postgraduate: [
      "Doctor of Philosophy in Education Major in Instructional Systems Design",
      "Doctor of Philosophy in Educational Administration",
      "Doctor of Philosophy in Science Education Major in Biology",
      "Doctor of Philosophy in Science Education Major in Mathematics",
      "Master of Arts in Education Major in Educational Administration",
      "Master of Arts in Education Major in English Language Teaching",
      "Master of Arts in Education Major in General Science",
      "Master of Arts in Education Major in Mathematics Education",
    ],
  },
  "College of Nursing": {
    undergraduate: [
      "Bachelor of Science in Nursing",
    ],
    postgraduate: [],
  },
  "College of Law": {
    undergraduate: [],
    postgraduate: [
      "Juris Doctor",
    ],
  },
  "College of Technologies": {
    undergraduate: [
      "Bachelor of Science in Automotive Technology",
      "Bachelor of Science in Electronics Technology",
      "Bachelor of Science in Entertainment and Multimedia Computing Major in Digital Animation Technology",
      "Bachelor of Science in Food Technology",
      "Bachelor of Science in Information Technology",
    ],
    postgraduate: [],
  },
  "College of Public Administration": {
    undergraduate: [
      "Bachelor of Public Administration",
    ],
    postgraduate: [
      "Doctor of Public Administration",
      "Master of Public Administration",
    ],
  },
};

// Get all courses for a specific college
export const getCoursesByCollege = (college) => {
  const collegeData = coursesData[college];
  if (!collegeData) return [];
  
  const allCourses = [
    ...collegeData.undergraduate,
    ...collegeData.postgraduate,
  ];
  
  return allCourses.map(course => ({
    value: course,
    label: course,
  }));
};

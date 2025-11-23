// Departments organized by college
export const departmentsData = {
  "College of Arts and Science": {
    undergraduate: [
      "Economics Department",
      "English Language Department",
      "Philosophy Department",
      "Philosophy (Teaching Track) Department",
      "Sociology Department",
      "Biotechnology / Biology Department",
      "Community Development Department",
      "Development Communication Department",
      "Environmental Science Department",
      "Mathematics Department",
    ],
    postgraduate: [
      "Graduate Studies - English Department",
      "Graduate Studies - Guidance and Counseling",
      "Graduate Studies - Sociology Department",
    ],
  },
  "College of Business": {
    undergraduate: [
      "Accountancy Department",
      "Business Administration Department",
      "Hospitality Management Department",
    ],
    postgraduate: [
      "Graduate School of Business / MBA Program",
    ],
  },
  "College of Education": {
    undergraduate: [
      "Early Childhood Education Department",
      "Elementary Education Department",
      "Physical Education Department",
      "Secondary Education - English Department",
      "Secondary Education - Filipino Department",
      "Secondary Education - Mathematics Department",
      "Secondary Education - Science Department",
      "Secondary Education - Social Studies Department",
    ],
    postgraduate: [
      "Graduate Studies - Educational Administration",
      "Graduate Studies - Instructional Systems Design",
      "Graduate Studies - Science Education (Biology)",
      "Graduate Studies - Science Education (Mathematics)",
      "Graduate Studies - English Language Teaching",
      "Graduate Studies - General Science",
      "Graduate Studies - Mathematics Education",
    ],
  },
  "College of Nursing": {
    undergraduate: [
      "Nursing Department",
    ],
    postgraduate: [],
  },
  "College of Law": {
    undergraduate: [],
    postgraduate: [
      "Law Department / Juris Doctor Program",
    ],
  },
  "College of Technologies": {
    undergraduate: [
      "Automotive Technology Department",
      "Electronics Technology Department",
      "Entertainment & Multimedia / Digital Animation Department",
      "Food Technology Department",
      "Information Technology Department",
    ],
    postgraduate: [],
  },
  "College of Public Administration": {
    undergraduate: [
      "Public Administration Department",
    ],
    postgraduate: [
      "Public Administration - Doctoral Program",
      "Public Administration - Master's Program",
    ],
  },
};

// Get all departments for a specific college
export const getDepartmentsByCollege = (college) => {
  const collegeData = departmentsData[college];
  if (!collegeData) return [];
  
  const allDepartments = [
    ...collegeData.undergraduate,
    ...collegeData.postgraduate,
  ];
  
  return allDepartments.map(dept => ({
    value: dept,
    label: dept,
  }));
};

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Semester from "../models/semester.js";
import Subject from "../models/subjects.js";
import Student from "../models/student.js";
import { encryptStudentData } from "../controller/encryptionController.js";
import { decryptStudentData } from "../controller/decryptionController.js";

dotenv.config();

const SEMESTER_PERIODS = [
  { schoolYear: "2025-2026", term: "1st" },
  { schoolYear: "2025-2026", term: "2nd" },
  { schoolYear: "2025-2026", term: "Summer" },
];

const SUBJECTS = [
  {
    subjectCode: "IT 111",
    subjectName: "Introduction to Computing",
    units: 3,
    college: "College of Technologies",
    department: "Information Technology",
    semesterKey: "2025-2026__1st",
  },
  {
    subjectCode: "IT 112",
    subjectName: "Computer Programming 1",
    units: 3,
    college: "College of Technologies",
    department: "Information Technology",
    semesterKey: "2025-2026__1st",
  },
  {
    subjectCode: "GE 101",
    subjectName: "Understanding the Self",
    units: 3,
    college: "College of Technologies",
    department: "General Education",
    semesterKey: "2025-2026__1st",
  },
  {
    subjectCode: "IT 121",
    subjectName: "Computer Programming 2",
    units: 3,
    college: "College of Technologies",
    department: "Information Technology",
    semesterKey: "2025-2026__2nd",
  },
  {
    subjectCode: "IT 122",
    subjectName: "Discrete Structures",
    units: 3,
    college: "College of Technologies",
    department: "Information Technology",
    semesterKey: "2025-2026__2nd",
  },
  {
    subjectCode: "NSTP 1",
    subjectName: "National Service Training Program 1",
    units: 3,
    college: "College of Technologies",
    department: "General Education",
    semesterKey: "2025-2026__Summer",
  },
];

const STUDENTS = [
  {
    studid: "2025-0001",
    email: "john.dela.cruz@student.buksu.edu.ph",
    fullName: "John Dela Cruz",
    college: "College of Technologies",
    course: "Bachelor of Science in Information Technology",
    yearLevel: "1st Year",
  },
  {
    studid: "2025-0002",
    email: "maria.santos@student.buksu.edu.ph",
    fullName: "Maria Santos",
    college: "College of Technologies",
    course: "Bachelor of Science in Information Technology",
    yearLevel: "1st Year",
  },
  {
    studid: "2025-0003",
    email: "paolo.reyes@student.buksu.edu.ph",
    fullName: "Paolo Reyes",
    college: "College of Technologies",
    course: "Bachelor of Science in Information Technology",
    yearLevel: "2nd Year",
  },
  {
    studid: "2025-0004",
    email: "angelica.tan@student.buksu.edu.ph",
    fullName: "Angelica Tan",
    college: "College of Education",
    course: "Bachelor of Secondary Education Major in Mathematics",
    yearLevel: "2nd Year",
  },
  {
    studid: "2025-0005",
    email: "james.uy@student.buksu.edu.ph",
    fullName: "James Uy",
    college: "College of Business",
    course: "Bachelor of Science in Accountancy",
    yearLevel: "3rd Year",
  },
  {
    studid: "2025-0006",
    email: "lyka.fernandez@student.buksu.edu.ph",
    fullName: "Lyka Fernandez",
    college: "College of Nursing",
    course: "Bachelor of Science in Nursing",
    yearLevel: "1st Year",
  },
];

const getSemesterKey = ({ schoolYear, term }) => `${schoolYear}__${term}`;

const normalizeEmail = (email) => email.trim().toLowerCase();

const buildSeedGoogleId = (studid) => `seed_${studid.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;

const seedSemesterPeriods = async () => {
  const semesterMap = new Map();
  let created = 0;
  let skipped = 0;

  for (const period of SEMESTER_PERIODS) {
    const existingSemester = await Semester.findOne({
      schoolYear: period.schoolYear,
      term: period.term,
    });

    if (existingSemester) {
      semesterMap.set(getSemesterKey(period), existingSemester);
      skipped += 1;
      continue;
    }

    const createdSemester = await Semester.create(period);
    semesterMap.set(getSemesterKey(period), createdSemester);
    created += 1;
  }

  return { semesterMap, created, skipped };
};

const seedSubjects = async (semesterMap) => {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const subjectSeed of SUBJECTS) {
    const semester = semesterMap.get(subjectSeed.semesterKey);

    if (!semester) {
      throw new Error(`Missing semester period for subject ${subjectSeed.subjectCode}: ${subjectSeed.semesterKey}`);
    }

    const existingSubject = await Subject.findOne({
      subjectCode: subjectSeed.subjectCode,
      semester: semester._id,
    });

    if (!existingSubject) {
      await Subject.create({
        subjectCode: subjectSeed.subjectCode,
        subjectName: subjectSeed.subjectName,
        units: subjectSeed.units,
        college: subjectSeed.college,
        department: subjectSeed.department,
        semester: semester._id,
      });
      created += 1;
      continue;
    }

    let changed = false;

    if (existingSubject.subjectName !== subjectSeed.subjectName) {
      existingSubject.subjectName = subjectSeed.subjectName;
      changed = true;
    }

    if (existingSubject.units !== subjectSeed.units) {
      existingSubject.units = subjectSeed.units;
      changed = true;
    }

    if (existingSubject.college !== subjectSeed.college) {
      existingSubject.college = subjectSeed.college;
      changed = true;
    }

    if (existingSubject.department !== subjectSeed.department) {
      existingSubject.department = subjectSeed.department;
      changed = true;
    }

    if (existingSubject.isArchived) {
      existingSubject.isArchived = false;
      existingSubject.archivedAt = null;
      existingSubject.archivedBy = null;
      changed = true;
    }

    if (changed) {
      await existingSubject.save();
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  return { created, updated, skipped };
};

const createStudentLookup = (students) => {
  const lookup = new Map();

  for (const student of students) {
    const decryptedStudent = decryptStudentData(student.toObject());

    if (decryptedStudent.email) {
      lookup.set(`email:${normalizeEmail(decryptedStudent.email)}`, student);
    }

    if (decryptedStudent.studid) {
      lookup.set(`studid:${decryptedStudent.studid}`, student);
    }
  }

  return lookup;
};

const applyStudentSeed = (studentDoc, studentSeed) => {
  const encryptedFields = encryptStudentData({
    email: normalizeEmail(studentSeed.email),
    fullName: studentSeed.fullName.trim(),
    studid: studentSeed.studid,
    googleId: buildSeedGoogleId(studentSeed.studid),
  });

  studentDoc.email = encryptedFields.email;
  studentDoc.fullName = encryptedFields.fullName;
  studentDoc.studid = encryptedFields.studid;
  studentDoc.googleId = encryptedFields.googleId;
  studentDoc.college = studentSeed.college;
  studentDoc.course = studentSeed.course;
  studentDoc.yearLevel = studentSeed.yearLevel;
  studentDoc.status = "Approved";
  studentDoc.role = "Student";
  studentDoc.authMethod = "google";
  studentDoc.isArchived = false;
  studentDoc.archivedAt = null;
  studentDoc.archivedBy = null;
};

const hasStudentChanges = (studentDoc, studentSeed) => {
  const decryptedStudent = decryptStudentData(studentDoc.toObject());

  return (
    normalizeEmail(decryptedStudent.email || "") !== normalizeEmail(studentSeed.email) ||
    (decryptedStudent.fullName || "") !== studentSeed.fullName.trim() ||
    (decryptedStudent.studid || "") !== studentSeed.studid ||
    (decryptedStudent.googleId || "") !== buildSeedGoogleId(studentSeed.studid) ||
    studentDoc.college !== studentSeed.college ||
    studentDoc.course !== studentSeed.course ||
    studentDoc.yearLevel !== studentSeed.yearLevel ||
    studentDoc.status !== "Approved" ||
    studentDoc.role !== "Student" ||
    studentDoc.authMethod !== "google" ||
    studentDoc.isArchived === true
  );
};

const seedStudents = async () => {
  const existingStudents = await Student.find({});
  const lookup = createStudentLookup(existingStudents);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const studentSeed of STUDENTS) {
    const emailKey = `email:${normalizeEmail(studentSeed.email)}`;
    const studidKey = `studid:${studentSeed.studid}`;
    const existingStudent = lookup.get(emailKey) || lookup.get(studidKey);

    if (!existingStudent) {
      const encryptedFields = encryptStudentData({
        email: normalizeEmail(studentSeed.email),
        fullName: studentSeed.fullName.trim(),
        studid: studentSeed.studid,
        googleId: buildSeedGoogleId(studentSeed.studid),
      });

      await Student.create({
        ...encryptedFields,
        college: studentSeed.college,
        course: studentSeed.course,
        yearLevel: studentSeed.yearLevel,
        status: "Approved",
        role: "Student",
        authMethod: "google",
      });

      created += 1;
      continue;
    }

    if (!hasStudentChanges(existingStudent, studentSeed)) {
      skipped += 1;
      continue;
    }

    applyStudentSeed(existingStudent, studentSeed);
    await existingStudent.save();
    updated += 1;
  }

  return { created, updated, skipped };
};

const runSeeder = async () => {
  try {
    await connectDB();

    const semesterResults = await seedSemesterPeriods();
    const subjectResults = await seedSubjects(semesterResults.semesterMap);
    const studentResults = await seedStudents();

    console.log("Academic seed completed.");
    console.log(
      `Semester periods -> created: ${semesterResults.created}, skipped: ${semesterResults.skipped}`
    );
    console.log(
      `Subjects -> created: ${subjectResults.created}, updated: ${subjectResults.updated}, skipped: ${subjectResults.skipped}`
    );
    console.log(
      `Students -> created: ${studentResults.created}, updated: ${studentResults.updated}, skipped: ${studentResults.skipped}`
    );
  } catch (error) {
    console.error("Academic seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runSeeder();

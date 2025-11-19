// test-semester-section-sync.js
// Test script to verify sections and activities auto-update when semester changes

import mongoose from 'mongoose';
import Semester from './models/semester.js';
import Subject from './models/subjects.js';
import Section from './models/sections.js';
import Activity from './models/activity.js';

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/grading_system";

async function testSemesterSectionSync() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    // Find a semester with subjects and sections
    const semesters = await Semester.find({ isArchived: { $ne: true } }).limit(1);
    if (semesters.length === 0) {
      console.log("No active semesters found");
      return;
    }

    const semester = semesters[0];
    console.log(`Testing with Semester: ${semester.schoolYear}, ${semester.term}`);
    console.log(`Semester ID: ${semester._id}\n`);

    // Find subjects linked to this semester
    const subjects = await Subject.find({ semester: semester._id });
    console.log(`Found ${subjects.length} subjects linked to this semester:`);
    subjects.forEach(s => console.log(`  - ${s.subjectCode}: ${s.subjectName}`));
    console.log();

    if (subjects.length === 0) {
      console.log("No subjects found for this semester");
      return;
    }

    const subjectIds = subjects.map(s => s._id);

    // Find sections for these subjects
    const sections = await Section.find({ subject: { $in: subjectIds } })
      .populate('subject', 'subjectCode subjectName');
    
    console.log(`Found ${sections.length} sections for these subjects:`);
    console.log("Current section data:");
    sections.forEach(s => {
      console.log(`  - Section ${s.sectionName} (${s.subject?.subjectCode})`);
      console.log(`    School Year: ${s.schoolYear}`);
      console.log(`    Term: ${s.term}`);
    });
    console.log();

    // Find activities for these subjects
    const activities = await Activity.find({ subject: { $in: subjectIds } })
      .populate('subject', 'subjectCode subjectName')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${activities.length} activities (showing latest 10):`);
    console.log("Current activity data:");
    activities.forEach(a => {
      console.log(`  - ${a.title} (${a.subject?.subjectCode})`);
      console.log(`    School Year: ${a.schoolYear}`);
      console.log(`    Term: ${a.term}`);
      console.log(`    Category: ${a.category}`);
    });
    console.log();

    // Check if sections match the semester
    const mismatchedSections = sections.filter(s => 
      s.schoolYear !== semester.schoolYear || s.term !== semester.term
    );

    // Check if activities match the semester
    const termMapping = { "1st": "Midterm", "2nd": "Finalterm", "Summer": "Summer" };
    const expectedActivityTerm = termMapping[semester.term] || semester.term;
    
    const mismatchedActivities = activities.filter(a => 
      a.schoolYear !== semester.schoolYear || a.term !== expectedActivityTerm
    );

    if (mismatchedSections.length > 0) {
      console.log(`⚠ Found ${mismatchedSections.length} sections with mismatched semester data:`);
      mismatchedSections.forEach(s => {
        console.log(`  - Section ${s.sectionName}: ${s.schoolYear} ${s.term} (expected: ${semester.schoolYear} ${semester.term})`);
      });
      console.log("\nThese should auto-update when the semester is updated via the admin panel.");
    } else {
      console.log("✓ All sections match the semester's schoolYear and term");
    }

    if (mismatchedActivities.length > 0) {
      console.log(`\n⚠ Found ${mismatchedActivities.length} activities with mismatched semester data:`);
      mismatchedActivities.forEach(a => {
        console.log(`  - Activity "${a.title}": ${a.schoolYear} ${a.term} (expected: ${semester.schoolYear} ${expectedActivityTerm})`);
      });
      console.log("\nThese should auto-update when the semester is updated via the admin panel.");
    } else {
      console.log("✓ All activities match the semester's schoolYear and term");
    }

    console.log("\n📝 NOTE: To test the auto-update feature:");
    console.log("1. Go to admin panel and update this semester's schoolYear or term");
    console.log("2. All sections linked to subjects in this semester should automatically update");
    console.log("3. All activities linked to subjects in this semester should automatically update");
    console.log("4. Grades should be recalculated for affected sections");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
  }
}

testSemesterSectionSync();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Section from './models/sections.js';
import Grade from './models/grades.js';
import Student from './models/student.js';
import Subject from './models/subjects.js';
import Instructor from './models/instructor.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    // Get a student
    const student = await Student.findOne();
    
    if (!student) {
      console.log('❌ No students found');
      process.exit(1);
    }
    
    console.log('👤 Student:', student.fullName, '(ID:', student._id, ')');
    
    // Get all sections (no filters)
    const allSections = await Section.find({ students: student._id })
      .populate('subject', 'subjectCode subjectName units')
      .populate('instructor', 'fullName');
    
    console.log('\n📚 ALL Sections student is enrolled in:', allSections.length);
    allSections.forEach((section, i) => {
      console.log(`\n${i+1}. ${section.sectionName}`);
      console.log(`   Subject: ${section.subject?.subjectCode} - ${section.subject?.subjectName}`);
      console.log(`   Term: ${section.term}`);
      console.log(`   School Year: ${section.schoolYear}`);
      console.log(`   Instructor: ${section.instructor?.fullName}`);
    });
    
    // Test filtering by term
    console.log('\n\n' + '='.repeat(80));
    console.log('Testing Term Filtering');
    console.log('='.repeat(80));
    
    const testTerms = ['1st', '2nd', 'Summer'];
    
    for (const term of testTerms) {
      const filteredSections = await Section.find({
        students: student._id,
        term: term
      })
        .populate('subject', 'subjectCode subjectName units')
        .populate('instructor', 'fullName');
      
      console.log(`\n📋 Sections for term "${term}": ${filteredSections.length}`);
      filteredSections.forEach((section) => {
        console.log(`   - ${section.sectionName} (${section.subject?.subjectCode}) - ${section.schoolYear}`);
      });
    }
    
    // Test filtering by school year
    console.log('\n\n' + '='.repeat(80));
    console.log('Testing School Year Filtering');
    console.log('='.repeat(80));
    
    const testYears = ['2024-2025', '2023-2024', '2025-2026'];
    
    for (const year of testYears) {
      const filteredSections = await Section.find({
        students: student._id,
        schoolYear: year
      })
        .populate('subject', 'subjectCode subjectName units')
        .populate('instructor', 'fullName');
      
      console.log(`\n📅 Sections for year "${year}": ${filteredSections.length}`);
      filteredSections.forEach((section) => {
        console.log(`   - ${section.sectionName} (${section.subject?.subjectCode}) - ${section.term}`);
      });
    }
    
    // Test exact query that API uses
    console.log('\n\n' + '='.repeat(80));
    console.log('Testing API Query (1st Semester, 2024-2025)');
    console.log('='.repeat(80));
    
    const apiQuery = {
      students: student._id,
      term: '1st',
      schoolYear: '2024-2025'
    };
    
    console.log('\nQuery:', JSON.stringify(apiQuery, null, 2));
    
    const apiSections = await Section.find(apiQuery)
      .populate('subject', 'subjectCode subjectName units')
      .populate('instructor', 'fullName');
    
    console.log(`\nFound ${apiSections.length} sections`);
    apiSections.forEach((section) => {
      console.log(`   - ${section.sectionName} (${section.subject?.subjectCode}) - ${section.term} - ${section.schoolYear}`);
    });
    
    // Get grades for these sections
    if (apiSections.length > 0) {
      const sectionIds = apiSections.map(s => s._id);
      const grades = await Grade.find({
        student: student._id,
        section: { $in: sectionIds }
      });
      
      console.log(`\nGrades found: ${grades.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

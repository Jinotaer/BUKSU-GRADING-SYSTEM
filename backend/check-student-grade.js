import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Grade from './models/grades.js';
import Section from './models/sections.js';
import Student from './models/student.js';
import Subject from './models/subjects.js';
import Instructor from './models/instructor.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    // Find section T102 (2nd semester, 2024-2025, IPT3)
    const section = await Section.findOne({ sectionName: 'T102' })
      .populate('subject')
      .populate('instructor')
      .populate('students');
    
    if (!section) {
      console.log('❌ Section T102 not found');
      process.exit(1);
    }
    
    console.log('📚 Section Details:');
    console.log('   Section:', section.sectionName);
    console.log('   Subject:', section.subject?.subjectCode, '-', section.subject?.subjectName);
    console.log('   Term:', section.term, section.schoolYear);
    console.log('   Students enrolled:', section.students.length);
    
    if (section.students.length > 0) {
      const student = section.students[0];
      console.log('\n👤 Student:', student.fullName, '(', student.studentId, ')');
      
      // Find grade for this student in this section
      const grade = await Grade.findOne({
        student: student._id,
        section: section._id
      });
      
      if (grade) {
        console.log('\n📊 Grade Record Found:');
        console.log('   Midterm Grade:', grade.midtermGrade, '%');
        console.log('   Midterm Equivalent:', grade.midtermEquivalentGrade);
        console.log('   Final Term Grade:', grade.finalTermGrade, '%');
        console.log('   Final Term Equivalent:', grade.finalTermEquivalentGrade);
        console.log('   Final Grade Numeric:', grade.finalGradeNumeric);
        console.log('   Equivalent Grade:', grade.equivalentGrade);
        console.log('   Remarks:', grade.remarks);
        console.log('   Has Laboratory:', grade.hasLaboratory);
        console.log('\n   Component Breakdowns:');
        console.log('   Midterm - CS:', grade.midtermClassStanding, '%, Lab:', grade.midtermLaboratory, '%, MO:', grade.midtermMajorOutput, '%');
        console.log('   Final - CS:', grade.finalClassStanding, '%, Lab:', grade.finalLaboratory, '%, MO:', grade.finalMajorOutput, '%');
      } else {
        console.log('\n❌ No grade record found for this student');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define schemas inline
const gradeSchema = new mongoose.Schema({}, { strict: false });
const sectionSchema = new mongoose.Schema({}, { strict: false });
const studentSchema = new mongoose.Schema({}, { strict: false });
const subjectSchema = new mongoose.Schema({}, { strict: false });

const Grade = mongoose.model('Grade', gradeSchema);
const Section = mongoose.model('Section', sectionSchema);
const Student = mongoose.model('Student', studentSchema);
const Subject = mongoose.model('Subject', subjectSchema);

mongoose.connect('mongodb://localhost:27017/admin-panel')
.then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    // Find a sample student
    const students = await Student.find().limit(1);
    if (students.length === 0) {
      console.log('❌ No students found');
      process.exit(0);
    }
    
    const student = students[0];
    console.log(`🎓 Checking grades for: ${student.fullName}`);
    console.log(`   Student ID: ${student._id}\n`);
    
    // Find sections for this student
    const sections = await Section.find({ students: student._id });
    console.log(`📚 Student enrolled in ${sections.length} sections\n`);
    
    // Find grades
    const grades = await Grade.find({ student: student._id });
    console.log(`📊 Found ${grades.length} grade records\n`);
    
    if (grades.length === 0) {
      console.log('⚠️  No grades found for this student');
      process.exit(0);
    }
    
    // Display each grade in detail
    for (let i = 0; i < grades.length; i++) {
      const g = grades[i];
      const section = await Section.findById(g.section);
      const subject = section ? await Subject.findById(section.subject) : null;
      
      console.log(`${'='.repeat(70)}`);
      console.log(`Grade Record ${i + 1}`);
      console.log(`${'='.repeat(70)}`);
      console.log(`Section: ${section?.sectionName || 'Unknown'}`);
      console.log(`Subject: ${subject?.subjectCode || 'Unknown'} - ${subject?.subjectName || 'Unknown'}`);
      console.log(`School Year: ${section?.schoolYear}, Term: ${section?.term}\n`);
      
      console.log('📋 COMPONENT AVERAGES:');
      console.log(`   Class Standing: ${g.classStanding?.toFixed(2) || 'N/A'}%`);
      console.log(`   Laboratory: ${g.laboratory?.toFixed(2) || 'N/A'}%`);
      console.log(`   Major Output: ${g.majorOutput?.toFixed(2) || 'N/A'}%\n`);
      
      console.log('📈 MIDTERM:');
      console.log(`   Class Standing: ${g.midtermClassStanding?.toFixed(2) || 'N/A'}%`);
      console.log(`   Laboratory: ${g.midtermLaboratory?.toFixed(2) || 'N/A'}%`);
      console.log(`   Major Output: ${g.midtermMajorOutput?.toFixed(2) || 'N/A'}%`);
      console.log(`   ⭐ Midterm Grade: ${g.midtermGrade?.toFixed(2) || 'N/A'}%`);
      console.log(`   ⭐ Midterm Equivalent: ${g.midtermEquivalentGrade || 'MISSING ❌'}\n`);
      
      console.log('📈 FINAL TERM:');
      console.log(`   Class Standing: ${g.finalClassStanding?.toFixed(2) || 'N/A'}%`);
      console.log(`   Laboratory: ${g.finalLaboratory?.toFixed(2) || 'N/A'}%`);
      console.log(`   Major Output: ${g.finalMajorOutput?.toFixed(2) || 'N/A'}%`);
      console.log(`   ⭐ Final Term Grade: ${g.finalTermGrade?.toFixed(2) || 'N/A'}%`);
      console.log(`   ⭐ Final Term Equivalent: ${g.finalTermEquivalentGrade || 'MISSING ❌'}\n`);
      
      console.log('🎯 FINAL GRADE:');
      console.log(`   Final Grade Numeric: ${g.finalGradeNumeric?.toFixed(2) || 'MISSING ❌'}`);
      console.log(`   Equivalent Grade: ${g.equivalentGrade || 'MISSING ❌'}`);
      console.log(`   Final Grade: ${g.finalGrade || 'MISSING ❌'}`);
      console.log(`   Remarks: ${g.remarks || 'N/A'}`);
      console.log(`   Has Laboratory: ${g.hasLaboratory ? 'Yes' : 'No'}\n`);
      
      // Check which fields are missing
      const missing = [];
      if (!g.midtermEquivalentGrade) missing.push('midtermEquivalentGrade');
      if (!g.finalTermEquivalentGrade) missing.push('finalTermEquivalentGrade');
      if (!g.finalGradeNumeric && g.finalGradeNumeric !== 0) missing.push('finalGradeNumeric');
      if (!g.equivalentGrade) missing.push('equivalentGrade');
      
      if (missing.length > 0) {
        console.log('❌ MISSING FIELDS:');
        missing.forEach(field => console.log(`   - ${field}`));
        console.log('\n⚠️  This grade needs to be recalculated!\n');
      } else {
        console.log('✅ All required fields present!\n');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  }
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

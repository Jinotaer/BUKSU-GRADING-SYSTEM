import mongoose from 'mongoose';
import Section from './models/sections.js';
import Grade from './models/grades.js';
import Student from './models/student.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/admin-panel', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Find all students
    const students = await Student.find().limit(3);
    console.log(`\n📚 Found ${students.length} students (showing first 3):`);
    students.forEach((s, i) => {
      console.log(`  ${i+1}. ${s.fullName} (${s.email}) - ID: ${s._id}`);
    });
    
    if (students.length === 0) {
      console.log('\n❌ No students found in database!');
      process.exit(0);
    }
    
    const testStudent = students[0];
    console.log(`\n🔍 Testing with student: ${testStudent.fullName}`);
    
    // Find sections where this student is enrolled
    const sections = await Section.find({ students: testStudent._id })
      .populate('subject', 'subjectCode subjectName')
      .populate('instructor', 'fullName');
    
    console.log(`\n📋 Sections for ${testStudent.fullName}:`);
    console.log(`   Total sections: ${sections.length}`);
    
    if (sections.length === 0) {
      console.log('\n❌ Student not enrolled in any sections!');
      console.log('   Please enroll the student in sections first.');
      process.exit(0);
    }
    
    sections.forEach((sec, i) => {
      console.log(`\n   ${i+1}. ${sec.sectionName}`);
      console.log(`      Subject: ${sec.subject?.subjectCode} - ${sec.subject?.subjectName}`);
      console.log(`      Term: ${sec.term}, Year: ${sec.schoolYear}`);
      console.log(`      Instructor: ${sec.instructor?.fullName || 'N/A'}`);
      console.log(`      Students enrolled: ${sec.students?.length}`);
    });
    
    // Find grades for this student
    const grades = await Grade.find({ student: testStudent._id })
      .populate({
        path: 'section',
        populate: { path: 'subject', select: 'subjectCode subjectName' }
      });
    
    console.log(`\n📊 Grades for ${testStudent.fullName}:`);
    console.log(`   Total grade records: ${grades.length}`);
    
    if (grades.length === 0) {
      console.log('\n⚠️ No grade records found!');
      console.log('   Grades need to be calculated first.');
      console.log('   Have activities and scores been entered?');
    } else {
      grades.forEach((g, i) => {
        console.log(`\n   ${i+1}. ${g.section?.subject?.subjectCode || 'N/A'}`);
        console.log(`      Midterm Grade: ${g.midtermGrade?.toFixed(2) || 0}%`);
        console.log(`      Midterm Equivalent: ${g.midtermEquivalentGrade || 'N/A'}`);
        console.log(`      Final Term Grade: ${g.finalTermGrade?.toFixed(2) || 0}%`);
        console.log(`      Final Term Equivalent: ${g.finalTermEquivalentGrade || 'N/A'}`);
        console.log(`      Final Grade Numeric: ${g.finalGradeNumeric?.toFixed(2) || 'N/A'}`);
        console.log(`      Equivalent Grade: ${g.equivalentGrade || g.finalGrade || 'N/A'}`);
        console.log(`      Remarks: ${g.remarks || 'N/A'}`);
      });
    }
    
    // Check for 1st semester data specifically
    console.log(`\n🔍 Checking 1st Semester 2024-2025 specifically:`);
    const firstSemSections = await Section.find({ 
      students: testStudent._id,
      term: '1st',
      schoolYear: '2024-2025'
    }).populate('subject', 'subjectCode');
    
    console.log(`   Sections found: ${firstSemSections.length}`);
    firstSemSections.forEach((sec, i) => {
      console.log(`   ${i+1}. ${sec.sectionName} - ${sec.subject?.subjectCode}`);
    });
    
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

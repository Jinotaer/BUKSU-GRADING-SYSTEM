import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Section from './models/sections.js';
import Subject from './models/subjects.js';
import Instructor from './models/instructor.js';
import Student from './models/student.js';
import Activity from './models/activity.js';
import ActivityScore from './models/activityScore.js';
import Grade from './models/grades.js';
import { calculateAndUpdateAllGradesInSection } from './utils/gradeCalculator.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Find all sections
    const sections = await Section.find()
      .populate('subject', 'subjectCode subjectName')
      .populate('instructor', 'fullName');
    
    console.log(`\n📋 Found ${sections.length} sections\n`);
    
    let totalSections = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    for (const section of sections) {
      if (section.students.length === 0) {
        console.log(`⏭️  Skipping ${section.sectionName} (no students enrolled)`);
        continue;
      }
      
      totalSections++;
      console.log(`\n🔄 Processing: ${section.sectionName}`);
      console.log(`   Subject: ${section.subject?.subjectCode} - ${section.subject?.subjectName}`);
      console.log(`   Term: ${section.term}, Year: ${section.schoolYear}`);
      console.log(`   Students: ${section.students.length}`);
      
      try {
        const results = await calculateAndUpdateAllGradesInSection(
          section._id.toString(),
          section.instructor?._id
        );
        
        console.log(`   ✅ Success: ${results.successful.length} students`);
        console.log(`   ❌ Failed: ${results.failed.length} students`);
        
        totalSuccessful += results.successful.length;
        totalFailed += results.failed.length;
        
        if (results.failed.length > 0) {
          results.failed.forEach(f => {
            console.log(`      Failed for student ${f.studentId}: ${f.error}`);
          });
        }
      } catch (error) {
        console.error(`   ❌ Error processing section: ${error.message}`);
        totalFailed += section.students.length;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Sections processed: ${totalSections}`);
    console.log(`✅ Successful grade calculations: ${totalSuccessful}`);
    console.log(`❌ Failed grade calculations: ${totalFailed}`);
    console.log('='.repeat(60));
    
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

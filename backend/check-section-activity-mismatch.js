import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Section from './models/sections.js';
import Activity from './models/activity.js';
import Subject from './models/subjects.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    // Get section T101
    const section = await Section.findOne({ sectionName: 'T101' })
      .populate('subject');
    
    if (!section) {
      console.log('❌ Section T102 not found');
      process.exit(1);
    }
    
    console.log('📚 Section T102:');
    console.log('   Current School Year:', section.schoolYear);
    console.log('   Current Term:', section.term);
    console.log('   Subject:', section.subject?.subjectCode);
    console.log('   Subject ID:', section.subject?._id);
    
    // Find activities for this subject
    const activities = await Activity.find({
      subject: section.subject._id
    });
    
    console.log('\n📋 Activities for subject', section.subject?.subjectCode, ':', activities.length);
    
    if (activities.length > 0) {
      console.log('\nActivity Details:');
      activities.forEach((act, i) => {
        console.log(`\n${i+1}. ${act.title}`);
        console.log(`   School Year: ${act.schoolYear}`);
        console.log(`   Term (Activity): ${act.term}`);
        console.log(`   Category: ${act.category}`);
        console.log(`   Max Score: ${act.maxScore}`);
      });
      
      // Check if activities match the section's school year
      const matchingActivities = activities.filter(a => a.schoolYear === section.schoolYear);
      const mismatchedActivities = activities.filter(a => a.schoolYear !== section.schoolYear);
      
      console.log('\n\n⚠️  MISMATCH CHECK:');
      console.log(`   Section is in: ${section.term} Semester, ${section.schoolYear}`);
      console.log(`   Activities matching school year: ${matchingActivities.length}`);
      console.log(`   Activities with different school year: ${mismatchedActivities.length}`);
      
      if (mismatchedActivities.length > 0) {
        console.log('\n   ❌ MISMATCHED ACTIVITIES:');
        mismatchedActivities.forEach(act => {
          console.log(`      - ${act.title} is in ${act.schoolYear} (should be ${section.schoolYear})`);
        });
        console.log('\n   This is why grades might not be calculating correctly!');
        console.log('   Activities are tied to the old school year.');
      }
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

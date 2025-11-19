import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Activity from './models/activity.js';
import Section from './models/sections.js';
import Subject from './models/subjects.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    const section = await Section.findOne({ sectionName: 'T102' }).populate('subject');
    
    console.log('📚 Section Details:');
    console.log('   Section Name:', section.sectionName);
    console.log('   Subject ID:', section.subject._id);
    console.log('   Subject Code:', section.subject.subjectCode);
    console.log('   School Year:', section.schoolYear);
    console.log('   Term:', section.term);
    
    console.log('\n🔍 Searching for activities with:');
    console.log('   subject:', section.subject._id);
    console.log('   schoolYear:', section.schoolYear);
    console.log('   term (Section):', section.term);
    console.log('   term (Activity - should be):', section.term === '1st' ? 'First' : section.term === '2nd' ? 'Second' : 'Summer');
    
    // Find ALL activities for this subject
    const allActivities = await Activity.find({
      subject: section.subject._id
    });
    
    console.log('\n📋 ALL Activities for subject IT102:');
    console.log('   Total:', allActivities.length);
    
    if (allActivities.length > 0) {
      allActivities.forEach((act, i) => {
        console.log(`\n   Activity ${i+1}:`);
        console.log('      Title:', act.title);
        console.log('      Category:', act.category);
        console.log('      Term:', act.term);
        console.log('      School Year:', act.schoolYear);
        console.log('      Max Score:', act.maxScore);
        console.log('      Is Active:', act.isActive);
      });
      
      // Find matching activities
      const matchingActivities = allActivities.filter(act => 
        act.schoolYear === section.schoolYear && 
        act.term === (section.term === '2nd' ? 'Second' : section.term === '1st' ? 'First' : 'Summer')
      );
      
      console.log('\n✅ Matching activities:', matchingActivities.length);
      console.log('   (These should be used for grade calculation)');
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

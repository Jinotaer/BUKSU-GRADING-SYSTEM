import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Activity from './models/activity.js';
import ActivityScore from './models/activityScore.js';
import Section from './models/sections.js';
import Subject from './models/subjects.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    const section = await Section.findOne({ sectionName: 'T102' }).populate('subject');
    
    if (!section) {
      console.log('❌ Section not found');
      process.exit(1);
    }
    
    console.log('📚 Section:', section.sectionName);
    console.log('   Subject:', section.subject?.subjectCode);
    console.log('   Term:', section.term, section.schoolYear);
    
    // Find activities for this subject/term/year
    const activities = await Activity.find({
      subject: section.subject._id,
      schoolYear: section.schoolYear,
      term: section.term === '1st' ? 'First' : section.term === '2nd' ? 'Second' : 'Summer'
    });
    
    console.log('\n📋 Activities found:', activities.length);
    
    if (activities.length > 0) {
      console.log('\nActivity List:');
      activities.forEach((act, i) => {
        console.log(`   ${i+1}. ${act.title} - ${act.category} (${act.term}) - Max: ${act.maxScore}`);
      });
      
      // Check if there are scores
      const activityIds = activities.map(a => a._id);
      const scores = await ActivityScore.find({
        activity: { $in: activityIds },
        section: section._id
      });
      
      console.log('\n📝 Activity Scores found:', scores.length);
      
      if (scores.length > 0) {
        console.log('\nScore Details:');
        scores.forEach((score, i) => {
          console.log(`   ${i+1}. Activity: ${score.activity}, Score: ${score.score}`);
        });
      }
    } else {
      console.log('\n⚠️  No activities created for this section!');
      console.log('   The instructor needs to create activities and enter scores.');
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

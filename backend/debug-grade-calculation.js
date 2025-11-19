import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Activity from './models/activity.js';
import ActivityScore from './models/activityScore.js';
import Grade from './models/grades.js';
import Section from './models/sections.js';
import Student from './models/student.js';
import Subject from './models/subjects.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    // Find both sections
    const sections = await Section.find({ sectionName: { $in: ['T101', 'T102'] } })
      .populate('subject')
      .populate('students');
    
    for (const section of sections) {
      console.log('\n' + '='.repeat(80));
      console.log(`📚 Section: ${section.sectionName}`);
      console.log(`   Subject: ${section.subject?.subjectCode} - ${section.subject?.subjectName}`);
      console.log(`   Term: ${section.term}, Year: ${section.schoolYear}`);
      console.log(`   Grading Schema:`, section.gradingSchema);
      
      // Find activities for this section
      const activities = await Activity.find({
        subject: section.subject._id,
        schoolYear: section.schoolYear,
        isActive: true
      }).sort({ term: 1, category: 1 });
      
      console.log(`\n   📋 Activities (${activities.length}):`);
      const midtermActs = activities.filter(a => a.term === 'Midterm');
      const finaltermActs = activities.filter(a => a.term === 'Finalterm');
      
      console.log(`      Midterm: ${midtermActs.length} activities`);
      midtermActs.forEach(a => {
        console.log(`         - ${a.title} (${a.category}) - Max: ${a.maxScore}`);
      });
      
      console.log(`      Finalterm: ${finaltermActs.length} activities`);
      finaltermActs.forEach(a => {
        console.log(`         - ${a.title} (${a.category}) - Max: ${a.maxScore}`);
      });
      
      // Get student and their scores
      if (section.students.length > 0) {
        const student = section.students[0];
        console.log(`\n   👤 Student: ${student.fullName}`);
        
        // Get activity scores
        const activityIds = activities.map(a => a._id);
        const scores = await ActivityScore.find({
          student: student._id,
          section: section._id,
          activity: { $in: activityIds }
        }).populate('activity');
        
        console.log(`\n   📝 Activity Scores (${scores.length}):`);
        
        let midtermCS = { earned: 0, max: 0 };
        let midtermLab = { earned: 0, max: 0 };
        let midtermMO = { earned: 0, max: 0 };
        let finalCS = { earned: 0, max: 0 };
        let finalLab = { earned: 0, max: 0 };
        let finalMO = { earned: 0, max: 0 };
        
        scores.forEach(score => {
          const act = score.activity;
          const earned = Number(score.score || 0);
          const max = Number(act.maxScore || 100);
          
          console.log(`      ${act.term} - ${act.category}: ${earned}/${max} (${act.title})`);
          
          if (act.term === 'Midterm') {
            if (act.category === 'classStanding') {
              midtermCS.earned += earned;
              midtermCS.max += max;
            } else if (act.category === 'laboratory') {
              midtermLab.earned += earned;
              midtermLab.max += max;
            } else if (act.category === 'majorOutput') {
              midtermMO.earned += earned;
              midtermMO.max += max;
            }
          } else if (act.term === 'Finalterm') {
            if (act.category === 'classStanding') {
              finalCS.earned += earned;
              finalCS.max += max;
            } else if (act.category === 'laboratory') {
              finalLab.earned += earned;
              finalLab.max += max;
            } else if (act.category === 'majorOutput') {
              finalMO.earned += earned;
              finalMO.max += max;
            }
          }
        });
        
        console.log(`\n   📊 Component Calculations:`);
        console.log(`      MIDTERM:`);
        console.log(`         CS: ${midtermCS.earned}/${midtermCS.max} = ${midtermCS.max > 0 ? ((midtermCS.earned/midtermCS.max)*100).toFixed(2) : 0}%`);
        console.log(`         Lab: ${midtermLab.earned}/${midtermLab.max} = ${midtermLab.max > 0 ? ((midtermLab.earned/midtermLab.max)*100).toFixed(2) : 0}%`);
        console.log(`         MO: ${midtermMO.earned}/${midtermMO.max} = ${midtermMO.max > 0 ? ((midtermMO.earned/midtermMO.max)*100).toFixed(2) : 0}%`);
        
        console.log(`      FINALTERM:`);
        console.log(`         CS: ${finalCS.earned}/${finalCS.max} = ${finalCS.max > 0 ? ((finalCS.earned/finalCS.max)*100).toFixed(2) : 0}%`);
        console.log(`         Lab: ${finalLab.earned}/${finalLab.max} = ${finalLab.max > 0 ? ((finalLab.earned/finalLab.max)*100).toFixed(2) : 0}%`);
        console.log(`         MO: ${finalMO.earned}/${finalMO.max} = ${finalMO.max > 0 ? ((finalMO.earned/finalMO.max)*100).toFixed(2) : 0}%`);
        
        // Calculate term grades using grading schema
        const hasLab = section.gradingSchema?.laboratory > 0;
        const csPercent = (midtermCS.max > 0 ? (midtermCS.earned/midtermCS.max)*100 : 0);
        const labPercent = (midtermLab.max > 0 ? (midtermLab.earned/midtermLab.max)*100 : 0);
        const moPercent = (midtermMO.max > 0 ? (midtermMO.earned/midtermMO.max)*100 : 0);
        
        let midtermGrade;
        if (hasLab) {
          midtermGrade = (csPercent * 0.30) + (labPercent * 0.30) + (moPercent * 0.40);
        } else {
          midtermGrade = (csPercent * 0.60) + (moPercent * 0.40);
        }
        
        console.log(`\n   🎯 Expected Midterm Grade: ${midtermGrade.toFixed(2)}%`);
        console.log(`      Formula: ${hasLab ? 'CS(30%) + Lab(30%) + MO(40%)' : 'CS(60%) + MO(40%)'}`);
        
        // Get grade from database
        const grade = await Grade.findOne({
          student: student._id,
          section: section._id
        });
        
        if (grade) {
          console.log(`\n   💾 Database Grade:`);
          console.log(`      Midterm: ${grade.midtermGrade}% → ${grade.midtermEquivalentGrade}`);
          console.log(`      Final: ${grade.finalTermGrade}% → ${grade.finalTermEquivalentGrade}`);
          console.log(`      Final Numeric: ${grade.finalGradeNumeric}`);
          console.log(`      Equivalent: ${grade.equivalentGrade}`);
          console.log(`      Remarks: ${grade.remarks}`);
          
          console.log(`\n   ⚠️  MISMATCH CHECK:`);
          if (Math.abs(grade.midtermGrade - midtermGrade) > 0.01) {
            console.log(`      ❌ Midterm mismatch! DB: ${grade.midtermGrade}% vs Calculated: ${midtermGrade.toFixed(2)}%`);
          } else {
            console.log(`      ✅ Midterm matches!`);
          }
        }
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

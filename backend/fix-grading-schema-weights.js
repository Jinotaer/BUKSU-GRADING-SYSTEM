// fix-grading-schema-weights.js
// Fix grading schema weights to BukSU standard: CS=30%, Lab=30%, MO=40% (with lab)

import mongoose from 'mongoose';
import Section from './models/sections.js';
import { calculateAndUpdateAllGradesInSection } from './utils/gradeCalculator.js';

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/grading_system";

async function fixGradingSchemaWeights() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    // Find all sections
    const sections = await Section.find({}).populate('subject', 'subjectCode subjectName');
    
    console.log(`Found ${sections.length} sections total\n`);
    
    let fixedCount = 0;
    let skippedCount = 0;

    for (const section of sections) {
      const schema = section.gradingSchema || {};
      const hasLab = schema.laboratory > 0;
      
      console.log(`\nSection: ${section.sectionName} (${section.subject?.subjectCode})`);
      console.log(`Current schema: CS=${schema.classStanding}%, Lab=${schema.laboratory}%, MO=${schema.majorOutput}%`);
      console.log(`Has Lab: ${hasLab}`);

      let needsUpdate = false;
      let newSchema = { ...schema };

      if (hasLab) {
        // BukSU Standard with Lab: CS=30%, Lab=30%, MO=40%
        if (schema.classStanding !== 30 || schema.laboratory !== 30 || schema.majorOutput !== 40) {
          newSchema = {
            classStanding: 30,
            laboratory: 30,
            majorOutput: 40
          };
          needsUpdate = true;
          console.log(`⚠ Needs update to: CS=30%, Lab=30%, MO=40%`);
        }
      } else {
        // BukSU Standard without Lab: CS=60%, Lab=0%, MO=40%
        if (schema.classStanding !== 60 || schema.laboratory !== 0 || schema.majorOutput !== 40) {
          newSchema = {
            classStanding: 60,
            laboratory: 0,
            majorOutput: 40
          };
          needsUpdate = true;
          console.log(`⚠ Needs update to: CS=60%, Lab=0%, MO=40%`);
        }
      }

      if (needsUpdate) {
        // Update the section
        section.gradingSchema = newSchema;
        await section.save();
        
        // Recalculate grades for all students in this section
        try {
          await calculateAndUpdateAllGradesInSection(section._id);
          console.log(`✅ Updated schema and recalculated grades`);
          fixedCount++;
        } catch (gradeError) {
          console.error(`❌ Error recalculating grades:`, gradeError.message);
        }
      } else {
        console.log(`✓ Schema is correct`);
        skippedCount++;
      }
    }

    console.log(`\n\n=== SUMMARY ===`);
    console.log(`Total sections: ${sections.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Already correct: ${skippedCount}`);
    console.log(`\n✅ All sections now use BukSU standard grading weights!`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
  }
}

fixGradingSchemaWeights();

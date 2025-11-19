import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Test grading calculations for subjects with and without laboratory

console.log('='.repeat(80));
console.log('Testing Grade Calculations');
console.log('='.repeat(80));

// Test Case 1: Subject WITH Laboratory (CS: 40%, Lab: 30%, MO: 30%)
console.log('\n📚 Test Case 1: Subject WITH Laboratory');
console.log('Grading Schema: CS=40%, Lab=30%, MO=30%');
console.log('Component Scores: CS=90%, Lab=100%, MO=95%');

const schema1 = { classStanding: 40, laboratory: 30, majorOutput: 30 };
const cs1 = 90, lab1 = 100, mo1 = 95;

const grade1 = (cs1 * (schema1.classStanding/100)) + 
               (lab1 * (schema1.laboratory/100)) + 
               (mo1 * (schema1.majorOutput/100));

console.log('\nCalculation:');
console.log(`  CS:  ${cs1}% × ${schema1.classStanding}% = ${(cs1 * schema1.classStanding/100).toFixed(2)}%`);
console.log(`  Lab: ${lab1}% × ${schema1.laboratory}% = ${(lab1 * schema1.laboratory/100).toFixed(2)}%`);
console.log(`  MO:  ${mo1}% × ${schema1.majorOutput}% = ${(mo1 * schema1.majorOutput/100).toFixed(2)}%`);
console.log(`  Total: ${grade1.toFixed(2)}%`);

// Test Case 2: Subject WITHOUT Laboratory (CS: 60%, Lab: 0%, MO: 40%)
console.log('\n\n📚 Test Case 2: Subject WITHOUT Laboratory');
console.log('Grading Schema: CS=60%, Lab=0%, MO=40%');
console.log('Component Scores: CS=90%, Lab=0%, MO=95%');

const schema2 = { classStanding: 60, laboratory: 0, majorOutput: 40 };
const cs2 = 90, lab2 = 0, mo2 = 95;

const grade2 = (cs2 * (schema2.classStanding/100)) + 
               (lab2 * (schema2.laboratory/100)) + 
               (mo2 * (schema2.majorOutput/100));

console.log('\nCalculation:');
console.log(`  CS:  ${cs2}% × ${schema2.classStanding}% = ${(cs2 * schema2.classStanding/100).toFixed(2)}%`);
console.log(`  Lab: ${lab2}% × ${schema2.laboratory}% = ${(lab2 * schema2.laboratory/100).toFixed(2)}%`);
console.log(`  MO:  ${mo2}% × ${schema2.majorOutput}% = ${(mo2 * schema2.majorOutput/100).toFixed(2)}%`);
console.log(`  Total: ${grade2.toFixed(2)}%`);

// Test Case 3: Custom Schema (CS: 50%, Lab: 20%, MO: 30%)
console.log('\n\n📚 Test Case 3: Custom Schema');
console.log('Grading Schema: CS=50%, Lab=20%, MO=30%');
console.log('Component Scores: CS=85%, Lab=90%, MO=88%');

const schema3 = { classStanding: 50, laboratory: 20, majorOutput: 30 };
const cs3 = 85, lab3 = 90, mo3 = 88;

const grade3 = (cs3 * (schema3.classStanding/100)) + 
               (lab3 * (schema3.laboratory/100)) + 
               (mo3 * (schema3.majorOutput/100));

console.log('\nCalculation:');
console.log(`  CS:  ${cs3}% × ${schema3.classStanding}% = ${(cs3 * schema3.classStanding/100).toFixed(2)}%`);
console.log(`  Lab: ${lab3}% × ${schema3.laboratory}% = ${(lab3 * schema3.laboratory/100).toFixed(2)}%`);
console.log(`  MO:  ${mo3}% × ${schema3.majorOutput}% = ${(mo3 * schema3.majorOutput/100).toFixed(2)}%`);
console.log(`  Total: ${grade3.toFixed(2)}%`);

// Verify weights add up to 100%
console.log('\n\n' + '='.repeat(80));
console.log('Weight Verification');
console.log('='.repeat(80));

const checkWeights = (schema, name) => {
  const total = schema.classStanding + schema.laboratory + schema.majorOutput;
  const valid = total === 100;
  console.log(`\n${name}: CS(${schema.classStanding}%) + Lab(${schema.laboratory}%) + MO(${schema.majorOutput}%) = ${total}%`);
  console.log(`  ${valid ? '✅ Valid' : '❌ Invalid'} - Weights ${valid ? 'sum to 100%' : 'do NOT sum to 100%'}`);
  return valid;
};

checkWeights(schema1, 'Schema 1 (With Lab)');
checkWeights(schema2, 'Schema 2 (No Lab)');
checkWeights(schema3, 'Schema 3 (Custom)');

console.log('\n' + '='.repeat(80));
console.log('✅ All calculations complete!');
console.log('='.repeat(80) + '\n');

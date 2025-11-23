import dotenv from 'dotenv';
import connectDB from './config/db.js';
import emailService from './services/emailService.js';
import Student from './models/student.js';
import Section from './models/sections.js';
import { bulkDecryptUserData } from './controller/decryptionController.js';

dotenv.config();

async function fullTest() {
  console.log('\n🔍 COMPREHENSIVE EMAIL TEST\n');
  console.log('=' .repeat(60));
  
  // 1. Check SMTP Configuration
  console.log('\n1️⃣  SMTP Configuration:');
  console.log('   SMTP_USER:', process.env.SMTP_USER);
  console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
  console.log('   SMTP_PASS (raw with spaces):', process.env.SMTP_PASS);
  console.log('   SMTP_PASS (cleaned):', process.env.SMTP_PASS?.replace(/\s/g, ''));
  
  // 2. Test Email Service Connection
  console.log('\n2️⃣  Testing Email Service:');
  const connectionTest = await emailService.verifyConnection();
  console.log('   Connection status:', connectionTest ? '✅ Connected' : '❌ Failed');
  
  if (!connectionTest) {
    console.log('\n❌ Email service not working. Stopping test.');
    return;
  }
  
  // 3. Connect to DB and test with real student data
  console.log('\n3️⃣  Connecting to Database...');
  await connectDB();
  console.log('   ✅ Database connected');
  
  // 4. Get a sample student
  console.log('\n4️⃣  Fetching Sample Student:');
  const students = await Student.find({ status: 'Approved' }).limit(1);
  
  if (students.length === 0) {
    console.log('   ⚠️  No approved students found in database');
    process.exit(0);
  }
  
  // 5. Decrypt student data
  const decryptedStudents = bulkDecryptUserData(students.map(s => s.toObject()), 'student');
  const student = decryptedStudents[0];
  
  console.log('   Student ID:', student._id);
  console.log('   Student Name:', student.fullName);
  console.log('   Student Email:', student.email);
  
  // 6. Test sending email
  console.log('\n5️⃣  Sending Test Email:');
  const emailResult = await emailService.sendSectionInvitation(
    student.email,
    student.fullName,
    {
      subjectCode: 'TEST101',
      subjectName: 'Test Subject',
      sectionName: 'TEST-A',
      schoolYear: '2024-2025',
      term: '1st'
    },
    'Test Instructor'
  );
  
  console.log('   Email send result:', emailResult);
  
  if (emailResult.success) {
    console.log('\n✅ SUCCESS! Email sent successfully to:', student.email);
  } else {
    console.log('\n❌ FAILED! Email not sent. Reason:', emailResult.message);
  }
  
  console.log('\n' + '='.repeat(60));
  process.exit(0);
}

fullTest().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});

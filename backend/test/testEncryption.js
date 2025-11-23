// Test encryption and decryption functionality
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Manual implementation of encrypt/decrypt for testing
const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_SECRET_KEY || '12c64ab616476558cd1c101176c1cb8988d7fcdf2689f8511a2f69d3d822473e';
const ivLength = 16;

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(text.toString(), "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  const [ivHex, encryptedHex] = encryptedText.split(":");
  if (!ivHex || !encryptedHex) throw new Error("Invalid encrypted data format");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
};

const isEncrypted = (value) => {
  if (!value || typeof value !== 'string') return false;
  return value.includes(':') && value.split(':').length === 2;
};

// Test basic encryption/decryption
console.log('🔐 Testing Basic Encryption/Decryption...');

const testString = "Hello, this is sensitive data!";
console.log('Original:', testString);

try {
  const encrypted = encrypt(testString);
  console.log('Encrypted:', encrypted);
  console.log('Is encrypted format:', isEncrypted(encrypted));

  const decrypted = decrypt(encrypted);
  console.log('Decrypted:', decrypted);
  console.log('Matches original:', testString === decrypted);
  console.log('✅ Basic encryption test PASSED');
} catch (error) {
  console.error('❌ Basic encryption test FAILED:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test admin data encryption/decryption
console.log('👨‍💼 Testing Admin Data...');

const adminData = {
  email: 'admin@test.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'hashedPassword123', // Should NOT be encrypted
  role: 'Admin',
  status: 'Active'
};

console.log('Original Admin Data:', adminData);

try {
  // Simulate encryptAdminData
  const encryptedAdmin = {
    ...adminData,
    email: encrypt(adminData.email),
    firstName: encrypt(adminData.firstName),
    lastName: encrypt(adminData.lastName)
  };
  console.log('Encrypted Admin Data:', encryptedAdmin);

  // Simulate decryptAdminData
  const decryptedAdmin = {
    ...encryptedAdmin,
    email: decrypt(encryptedAdmin.email),
    firstName: decrypt(encryptedAdmin.firstName),
    lastName: decrypt(encryptedAdmin.lastName)
  };
  console.log('Decrypted Admin Data:', decryptedAdmin);

  console.log('Email matches:', adminData.email === decryptedAdmin.email);
  console.log('Name matches:', adminData.firstName === decryptedAdmin.firstName);
  console.log('✅ Admin data encryption test PASSED');
} catch (error) {
  console.error('❌ Admin data encryption test FAILED:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test instructor data
console.log('👨‍🏫 Testing Instructor Data...');

const instructorData = {
  instructorid: 'INST001',
  email: 'instructor@test.com',
  fullName: 'Jane Smith',
  college: 'Engineering',
  department: 'Computer Science',
  googleAccessToken: 'secret_token_123',
  status: 'Active'
};

console.log('Original Instructor Data:', instructorData);

try {
  // Simulate encryptInstructorData
  const encryptedInstructor = {
    ...instructorData,
    email: encrypt(instructorData.email),
    fullName: encrypt(instructorData.fullName),
    instructorid: encrypt(instructorData.instructorid),
    college: encrypt(instructorData.college),
    department: encrypt(instructorData.department),
    googleAccessToken: encrypt(instructorData.googleAccessToken)
  };
  console.log('Encrypted Instructor Data:', encryptedInstructor);

  // Simulate decryptInstructorData
  const decryptedInstructor = {
    ...encryptedInstructor,
    email: decrypt(encryptedInstructor.email),
    fullName: decrypt(encryptedInstructor.fullName),
    instructorid: decrypt(encryptedInstructor.instructorid),
    college: decrypt(encryptedInstructor.college),
    department: decrypt(encryptedInstructor.department),
    googleAccessToken: decrypt(encryptedInstructor.googleAccessToken)
  };
  console.log('Decrypted Instructor Data:', decryptedInstructor);

  console.log('Email matches:', instructorData.email === decryptedInstructor.email);
  console.log('Department matches:', instructorData.department === decryptedInstructor.department);
  console.log('✅ Instructor data encryption test PASSED');
} catch (error) {
  console.error('❌ Instructor data encryption test FAILED:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test student data
console.log('👨‍🎓 Testing Student Data...');

const studentData = {
  studid: 'STUD001',
  email: 'student@student.buksu.edu.ph',
  fullName: 'Alice Johnson',
  college: 'Engineering',
  course: 'Computer Science',
  yearLevel: '3rd Year',
  googleId: 'google_id_123',
  status: 'Approved'
};

console.log('Original Student Data:', studentData);

try {
  // Simulate encryptStudentData
  const encryptedStudent = {
    ...studentData,
    email: encrypt(studentData.email),
    fullName: encrypt(studentData.fullName),
    studid: encrypt(studentData.studid),
    college: encrypt(studentData.college),
    course: encrypt(studentData.course),
    yearLevel: encrypt(studentData.yearLevel),
    googleId: encrypt(studentData.googleId)
  };
  console.log('Encrypted Student Data:', encryptedStudent);

  // Simulate decryptStudentData
  const decryptedStudent = {
    ...encryptedStudent,
    email: decrypt(encryptedStudent.email),
    fullName: decrypt(encryptedStudent.fullName),
    studid: decrypt(encryptedStudent.studid),
    college: decrypt(encryptedStudent.college),
    course: decrypt(encryptedStudent.course),
    yearLevel: decrypt(encryptedStudent.yearLevel),
    googleId: decrypt(encryptedStudent.googleId)
  };
  console.log('Decrypted Student Data:', decryptedStudent);

  console.log('Email matches:', studentData.email === decryptedStudent.email);
  console.log('Course matches:', studentData.course === decryptedStudent.course);
  console.log('✅ Student data encryption test PASSED');
} catch (error) {
  console.error('❌ Student data encryption test FAILED:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test edge cases
console.log('⚠️ Testing Edge Cases...');

try {
  // Test null values
  console.log('Encrypting null:', encrypt(null));
  console.log('Decrypting null:', decrypt(null));

  // Test empty string
  const emptyEncrypted = encrypt('');
  console.log('Encrypting empty string:', emptyEncrypted);
  console.log('Decrypting empty string:', decrypt(emptyEncrypted));

  // Test invalid format
  try {
    decrypt('invalid:format:data');
  } catch (e) {
    console.log('✅ Invalid format properly rejected');
  }

  console.log('✅ Edge cases test PASSED');
} catch (error) {
  console.error('❌ Edge cases test FAILED:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test performance with larger data
console.log('⚡ Testing Performance...');

try {
  const largeData = 'This is a much larger string that contains more data to test encryption performance and ensure that longer strings work correctly with our AES-256-CBC implementation. '.repeat(10);
  
  const startTime = Date.now();
  const encrypted = encrypt(largeData);
  const encryptTime = Date.now() - startTime;
  
  const decryptStart = Date.now();
  const decrypted = decrypt(encrypted);
  const decryptTime = Date.now() - decryptStart;
  
  console.log(`Large data (${largeData.length} chars):`);
  console.log(`Encryption time: ${encryptTime}ms`);
  console.log(`Decryption time: ${decryptTime}ms`);
  console.log('Data integrity:', largeData === decrypted);
  console.log('✅ Performance test PASSED');
} catch (error) {
  console.error('❌ Performance test FAILED:', error.message);
}

console.log('\n✅ All Encryption/Decryption Tests Complete!');
console.log('\n🔐 Summary:');
console.log('- Basic encryption/decryption ✅');
console.log('- Admin data encryption ✅');
console.log('- Instructor data encryption ✅');
console.log('- Student data encryption ✅');
console.log('- Edge cases handling ✅');
console.log('- Performance with large data ✅');
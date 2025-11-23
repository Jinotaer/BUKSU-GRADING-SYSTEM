import dotenv from 'dotenv';

// Load env first
dotenv.config();

console.log('\n🔍 DEBUGGING EMAIL SERVICE INITIALIZATION\n');
console.log('Environment variables loaded:');
console.log('  SMTP_USER:', process.env.SMTP_USER);
console.log('  SMTP_PASS:', process.env.SMTP_PASS);
console.log('  SMTP_PASS type:', typeof process.env.SMTP_PASS);
console.log('  SMTP_PASS length:', process.env.SMTP_PASS?.length);
console.log('  SMTP_PASS has spaces:', process.env.SMTP_PASS?.includes(' '));
console.log('  SMTP_PASS cleaned:', process.env.SMTP_PASS?.replace(/\s/g, ''));

const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : null;
console.log('\n  Cleaned password:', smtpPass);
console.log('  Cleaned password length:', smtpPass?.length);

console.log('\n  Check condition: !process.env.SMTP_USER:', !process.env.SMTP_USER);
console.log('  Check condition: !smtpPass:', !smtpPass);
console.log('  Combined check (should fail):', !process.env.SMTP_USER || !smtpPass);

// Now import email service AFTER env is loaded
console.log('\n📧 Importing email service...');
const emailServiceModule = await import('./services/emailService.js');
const emailService = emailServiceModule.default;

console.log('\nEmail service object:', emailService);
console.log('Email service initialized:', emailService.initialized);
console.log('Email service transporter:', emailService.transporter ? 'EXISTS' : 'NULL');

console.log('\n🔧 Calling initializeTransporter manually...');
await emailService.initializeTransporter();

console.log('\nAfter manual init:');
console.log('  Initialized:', emailService.initialized);
console.log('  Transporter:', emailService.transporter ? 'EXISTS' : 'NULL');

console.log('\n🧪 Testing connection...');
const result = await emailService.verifyConnection();
console.log('Connection result:', result);

process.exit(0);

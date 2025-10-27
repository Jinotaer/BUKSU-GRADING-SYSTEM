// seeders/seedAdminAccounts.js
import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";

const parseAdminsFromEnv = () => {
  const raw = process.env.ADMIN_ACCOUNTS;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
      console.warn("⚠️ ADMIN_ACCOUNTS is not an array. Falling back to single ADMIN_* vars.");
    } catch (e) {
      console.warn("⚠️ Failed to parse ADMIN_ACCOUNTS JSON. Falling back to single ADMIN_* vars.");
    }
  }
  // Fallback to single admin from individual envs
  return [{
    email:     process.env.ADMIN_EMAIL     || "admin@buksu.edu.ph",
    password:  process.env.ADMIN_PASSWORD  || "admin123456",
    firstName: process.env.ADMIN_FIRST_NAME || "System",
    lastName:  process.env.ADMIN_LAST_NAME  || "Administrator",
    schoolName: process.env.ADMIN_SCHOOL_NAME // optional
  }];
};

const normalize = v => (typeof v === "string" ? v.trim() : v);

const seedAdminAccounts = async () => {
  const admins = parseAdminsFromEnv()
    .filter(a => a && a.email)
    .map(a => ({
      email: normalize(a.email?.toLowerCase()),
      password: a.password || "admin123456",
      firstName: normalize(a.firstName) || "System",
      lastName: normalize(a.lastName) || "Administrator",
      ...(a.schoolName ? { schoolName: normalize(a.schoolName) } : {})
    }));

  if (admins.length === 0) {
    console.log("ℹ️  No admin data found to seed.");
    return;
  }

  // Build bulk upsert ops with pre-hashed passwords
  const ops = [];
  for (const a of admins) {
    const hashed = await bcrypt.hash(a.password, 12);
    const doc = {
      email: a.email,
      firstName: a.firstName,
      lastName: a.lastName,
      password: hashed,
      role: "Admin",
      status: "Active",
      // ...(a.schoolName ? { schoolName: a.schoolName } : {})
    };
    ops.push({
      updateOne: {
        filter: { email: a.email },
        update: { $setOnInsert: doc },
        upsert: true
      }
    });
  }

  const res = await Admin.bulkWrite(ops, { ordered: false });
  console.log(`✅ Admin seeding complete. Upserted: ${res.upsertedCount ?? 0}, Matched: ${res.matchedCount ?? 0}`);
};

export default seedAdminAccounts;

import passport from "passport";
import pkg from "passport-google-oauth20";
const { Strategy: GoogleStrategy } = pkg;
import Student from "../models/student.js";
import Instructor from "../models/instructor.js";

export default function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const googleId = profile.id;

          // 🧩 1. Handle Student Login
          if (email.endsWith("@student.buksu.edu.ph")) {
            const student = await Student.findOne({ email });

            if (!student) {
              // Redirect to registration page (frontend handles this)
              return done(null, false, { message: "Unregistered student account" });
            }

            if (student.status !== "Approved") {
              return done(null, false, { message: "Student account not approved yet" });
            }

            // Attach Google ID if not stored yet
            if (!student.googleId) {
              student.googleId = googleId;
              await student.save();
            }

            return done(null, { user: student, role: "student" });
          }

          // 🧩 2. Handle Instructor Login
          if (email.endsWith("@buksu.edu.ph")) {
            const instructor = await Instructor.findOne({ email });

            if (!instructor) {
              // Not invited by admin
              return done(null, false, { message: "You are not invited. Contact admin." });
            }

            // Instructor should already be active since auto-approved on invitation
            if (instructor.status !== "Active") {
              return done(null, false, { message: "Instructor account not active" });
            }

            // Attach Google ID if not stored yet
            if (!instructor.googleId) {
              instructor.googleId = googleId;
              await instructor.save();
            }

            return done(null, { user: instructor, role: "instructor" });
          }

          // 🚫 3. Fallback for other emails
          return done(null, false, { message: "Unauthorized email domain" });
        } catch (error) {
          console.error("Passport error:", error);
          return done(error, false);
        }
      }
    )
  );

  // 🔐 Session management
  passport.serializeUser((data, done) => {
    done(null, { id: data.user._id, role: data.role });
  });

  passport.deserializeUser(async (obj, done) => {
    try {
      if (obj.role === "student") {
        const student = await Student.findById(obj.id);
        return done(null, { user: student, role: "student" });
      } else if (obj.role === "instructor") {
        const instructor = await Instructor.findById(obj.id);
        return done(null, { user: instructor, role: "instructor" });
      }
      done(null, false);
    } catch (error) {
      done(error, false);
    }
  });
}

// controllers/supabaseAuth.js
const supabase = require("../utils/supabase");
const bcrypt = require("bcryptjs");

/**
 * Unified Login Handler
 * - Tries Supabase Auth first (for admins)
 * - Falls back to custom users table (for normal users)
 */
module.exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      req.flash("error", "Email and password are required.");
      return res.redirect("/login");
    }

    email = email.trim().toLowerCase();
    console.log("🔐 LOGIN ATTEMPT:", { email });

    // ============================================
    // STEP 1: Try Supabase Auth (for ADMINS)
    // ============================================
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authData?.user) {
      console.log("✅ Supabase Auth successful (checking if admin)");

      // Check if user is in admins table
      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("id, email, role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (admin) {
        console.log("👑 ADMIN LOGIN SUCCESSFUL");

        // Set admin session
        req.session.supabaseUser = {
          id: authData.user.id,
          email: authData.user.email,
          username: admin.email.split("@")[0], // fallback username
        };
        req.session.role = "admin";

        req.flash("success", "Welcome back, Admin!");
        return res.redirect("/admin/dashboard");
      } else {
        // User exists in auth.users but not in admins table
        console.log("⚠️ User in auth.users but NOT an admin");
        await supabase.auth.signOut(); // Clean up
      }
    }

    // ============================================
    // STEP 2: Try Custom Users Table (for NORMAL USERS)
    // ============================================
    console.log("🔍 Checking custom users table...");

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, username, email, phone, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("❌ Database error:", userError);
      req.flash("error", "Login failed. Please try again.");
      return res.redirect("/login");
    }

    if (!user) {
      console.log("❌ No user found with this email");
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("🔑 Password match:", isMatch);

    if (!isMatch) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    // ============================================
    // STEP 3: Normal User Login Successful
    // ============================================
    console.log("✅ NORMAL USER LOGIN SUCCESSFUL");

    req.session.supabaseUser = {
      id: user.id,
      email: user.email,
      username: user.username || user.email.split("@")[0],
      phone: user.phone,
    };
    req.session.role = "user";

    console.log("📝 Session created:", {
      email: user.email,
      role: "user",
    });

    req.flash("success", "Welcome back!");

    const redirectUrl = res.locals.redirectUrl || "/listings";
    return res.redirect(redirectUrl);
  } catch (e) {
    console.error("💥 Login error:", e);
    req.flash("error", "Login failed. Please try again.");
    return res.redirect("/login");
  }
};

/**
 * Logout Handler
 */
module.exports.logout = async (req, res) => {
  try {
    // Sign out from Supabase Auth (if admin was logged in)
    await supabase.auth.signOut();

    // Destroy session
    req.session.destroy((err) => {
      if (err) console.error("Logout error:", err);
      res.redirect("/login");
    });
  } catch (e) {
    console.error("Logout error:", e);
    res.redirect("/login");
  }
};

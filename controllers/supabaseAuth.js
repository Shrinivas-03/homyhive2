const supabase = require("../utils/supabaseClient");

module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log("LOGIN ATTEMPT:", { email });

  // 1️⃣ Authenticate with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user) {
    console.error("Supabase auth error:", error);
    req.flash("error", error?.message || "Login failed");
    return res.redirect("/login");
  }

  const user = data.user;

  console.log("Supabase user authenticated:", {
    id: user.id,
    email: user.email,
  });

  // 2️⃣ Check admin table (ROLE CHECK ONLY)
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle(); // ✅ SAFE

  if (adminError) {
    console.error("Admin lookup error:", adminError);
  }

  console.log("Admin lookup result:", admin);

  // 3️⃣ Create session
  req.session.supabaseUser = {
    id: user.id,
    email: user.email,
  };

  // 4️⃣ Redirect based on role
  if (admin) {
    req.session.role = "admin";
    console.log("Logged in as ADMIN");
    return res.redirect("/admin/dashboard");
  }

  req.session.role = "user";
  console.log("Logged in as USER");
  return res.redirect("/");
};

module.exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

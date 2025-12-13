const supabase = require("../utils/supabaseClient");

module.exports.renderLogin = (req, res) => {
  res.render("users/login");
};

module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1️⃣ LOGIN USING SUPABASE AUTH
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  const user = data.user;

  // 2️⃣ CHECK ADMIN TABLE (ROLE CHECK ONLY)
  const { data: admin } = await supabase
    .from("admins")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle(); // ✅ VERY IMPORTANT

  // 3️⃣ SESSION SETUP
  req.session.supabaseUser = {
    id: user.id,
    email: user.email,
  };

  if (admin) {
    req.session.role = "admin";
    return res.redirect("/admin/dashboard");
  }

  req.session.role = "user";
  return res.redirect("/");
};

module.exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

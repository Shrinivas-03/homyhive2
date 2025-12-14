// app.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");

// ✅ ADDITION (ADMIN BOOTSTRAP KE LIYE)
const User = require("./models/user");

// Routes
const listingsRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const newsletterRouter = require("./routes/newsletter");
const staticRouter = require("./routes/static");
const adminRouter = require("./routes/admin");
const hostRouter = require("./routes/host");
const chatbotRouter = require("./routes/chatbot");
const paymentRouter = require("./routes/payment");
const hostPaymentRouter = require("./routes/host_payment");

// Middleware helpers
const { attachSupabaseUser, injectChatbot } = require("./middleware");

const app = express();

// ---------------- DB CONNECTION ----------------
const dbUrl =
  process.env.ATLASDB_URL ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/homyhive";

// ✅ DEFAULT ADMIN FUNCTION (ADDITION ONLY)
async function ensureDefaultAdmin() {
  const adminEmail = "admin@homyhive.com";

  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    await User.create({
      email: adminEmail,
      displayName: "Super Admin",
      isAdmin: true,
      isHost: false,
    });
    console.log("✅ Default admin created:", adminEmail);
  } else if (!admin.isAdmin) {
    admin.isAdmin = true;
    await admin.save();
    console.log("⚠️ Existing user promoted to admin:", adminEmail);
  } else {
    console.log("ℹ️ Admin already exists:", adminEmail);
  }
}

mongoose
  .connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB");
    await ensureDefaultAdmin(); // ✅ ONLY ADDITION
  })
  .catch((err) => console.error("MongoDB connection error:", err.message));

// ---------------- VIEW ENGINE ----------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------- MIDDLEWARES ----------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session store
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET || "keyboardcat",
  },
  touchAfter: 24 * 3600,
});

app.use(
  session({
    store,
    secret: process.env.SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(flash());

// Expose session user to templates
app.use((req, res, next) => {
  res.locals.supabaseUser = req.session.supabaseUser || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Attach Mongo user from Supabase session
app.use(attachSupabaseUser);

// Chatbot config
app.use(injectChatbot({ apiPath: "/api/chat" }));

// ---------------- ROUTES ----------------
app.use("/newsletter", newsletterRouter);
app.use("/", paymentRouter); // paymentRouter is now here
app.use("/", hostPaymentRouter);
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/admin", adminRouter); // ✅ ADMIN ACCESS
app.use("/host", hostRouter);
app.use("/", userRouter);
app.use("/", staticRouter);

// Chatbot
if (chatbotRouter) app.use("/", chatbotRouter);

app.get("/chat", (req, res) => {
  res.render("chat/fullchat", {
    chatbotConfig: res.locals.chatbotConfig,
  });
});

// Home
app.get("/", (req, res) => res.render("home"));

// ---------------- ERROR HANDLERS ----------------
app.all("*", (req, res, next) => next(new ExpressError(404, "Page Not Found")));

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  res.status(status);

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.json({ ok: false, status, message });
  }
  res.render("error", { message });
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`🚀 HomyHive running on http://localhost:${port}`),
);

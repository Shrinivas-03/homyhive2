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

// Routes (require after defining middleware import below)
const listingsRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const newsletterRouter = require("./routes/newsletter");
const staticRouter = require("./routes/static");
const adminRouter = require("./routes/admin");
const hostRouter = require("./routes/host");
const chatbotRouter = require("./routes/chatbot");

// Local middleware helpers
const { attachSupabaseUser, injectChatbot } = require("./middleware");

const app = express();

// --- DB connection ---
const dbUrl = process.env.ATLASDB_URL || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/homyhive";
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("MongoDB connection error:", err && err.message ? err.message : err);
  });

// --- View engine ---
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Middlewares ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// session store
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET || process.env.SESSION_SECRET || "keyboardcat" },
  touchAfter: 24 * 3600
});
store.on("error", (e) => console.error("Session store error", e));

app.use(session({
  store,
  secret: process.env.SECRET || process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 }
}));

app.use(flash());

// expose session user to EJS
app.use((req, res, next) => {
  res.locals.supabaseUser = req.session ? req.session.supabaseUser : null;
  next();
});

// attach supabase-backed Mongo user (adds res.locals.currUser)
app.use(attachSupabaseUser);

// inject chatbot config/flag into templates (run before routes so EJS can use it)
app.use(injectChatbot({ apiPath: "/api/chat" }));

// flash messages in templates
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// --- Routes (mount after middleware) ---
app.use("/newsletter", newsletterRouter);
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/admin", adminRouter);
app.use("/host", hostRouter);
app.use("/", userRouter);
app.use("/", staticRouter);

// chatbot endpoints and full-screen chat page (if you use chatbotRouter)
if (chatbotRouter) app.use("/", chatbotRouter);

// a full-screen chat route (templates expect res.locals.chatbotConfig)
app.get("/chat", (req, res) => {
  res.render("chat/fullchat", { chatbotConfig: res.locals.chatbotConfig || { apiPath: "/api/chat" } });
});

// Home
app.get("/", (req, res) => res.render("home"));

// 404 and error handlers
app.all("*", (req, res, next) => next(new ExpressError(404, "Page Not Found")));

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  res.status(status);
  // If client expects JSON (ajax), send JSON
  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.json({ ok: false, status, message });
  }
  res.render("error", { message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`HomyHive running on http://localhost:${port}`));

// middleware.js
// ✅ Supabase-only authentication - NO MongoDB User dependencies

const url = require("url");
const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema");

// ==========================================
// CHATBOT CONFIGURATION
// ==========================================

const CHATBOT_EXCLUDE = [
  "/login",
  "/signin",
  "/signup",
  "/register",
  "/admin",
  "/admin/",
  "/static/",
  "/api/",
  "/verify-otp",
];

function normalizePath(p) {
  try {
    return url.parse(p).pathname || "/";
  } catch {
    return p || "/";
  }
}

function shouldSkipChatbot(path) {
  const p = normalizePath(path);
  for (const ex of CHATBOT_EXCLUDE) {
    if (ex.endsWith("*")) {
      if (p.startsWith(ex.slice(0, -1))) return true;
    } else {
      if (p === ex || p.startsWith(ex + "/")) return true;
    }
  }
  return false;
}

function injectChatbot(options = {}) {
  const apiPath = options.apiPath || "/api/chat";
  return (req, res, next) => {
    try {
      const path = req.originalUrl || req.path || req.url || "/";
      const skip = shouldSkipChatbot(path);
      res.locals.showChatbot = !skip;
      res.locals.chatbotConfig = { apiPath };
    } catch {
      res.locals.showChatbot = false;
      res.locals.chatbotConfig = { apiPath };
    }
    next();
  };
}

// ==========================================
// SUPABASE SESSION HANDLER
// ✅ NO MongoDB User - Supabase session ONLY
// ==========================================

const User = require("./models/user");

// ...

async function attachSupabaseUser(req, res, next) {
  req.user = null;
  res.locals.currUser = null;
  res.locals.userRole = null;
  res.locals.supabaseUser = null;
  try {
    if (req.session?.supabaseUser) {
      const sbUser = req.session.supabaseUser;
      console.log("Supabase user from session:", sbUser);
      res.locals.supabaseUser = sbUser;
      res.locals.userRole = req.session.role || "user";

      let mongoUser = await User.findOne({ supabaseId: sbUser.id });

      if (!mongoUser) {
        console.log("Mongo user not found by supabaseId, trying email...");
        mongoUser = await User.findOne({ email: sbUser.email });
        if (mongoUser) {
          console.log("Found user by email, updating supabaseId...");
          mongoUser.supabaseId = sbUser.id;
          await mongoUser.save();
        }
      }

      console.log("Mongo user found:", mongoUser);

      if (mongoUser) {
        req.user = mongoUser;
        res.locals.currUser = mongoUser;
      } else {
        console.log("Mongo user not found for supabaseId:", sbUser.id);
        res.locals.currUser = {
          id: sbUser.id,
          email: sbUser.email,
          username: sbUser.username || sbUser.email.split("@")[0],
          phone: sbUser.phone || null,
        };
      }
    }
  } catch (e) {
    console.warn("attachSupabaseUser error:", e?.message || e);
  }
  next();
} // ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

const isLoggedIn = (req, res, next) => {
  if (req.session?.supabaseUser) return next();
  req.session.redirectUrl = req.originalUrl;
  req.flash("error", "You must be logged in.");
  return res.redirect("/login");
};

const saveRedirectUrl = (req, res, next) => {
  if (req.session?.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// ==========================================
// LISTING OWNERSHIP CHECK
// ✅ Uses Supabase user email instead of MongoDB User ID
// ==========================================

const isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id).exec();

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // ✅ Check ownership by email (from Supabase session)
    const userEmail = req.session?.supabaseUser?.email;
    if (!userEmail || listing.ownerEmail !== userEmail) {
      req.flash("error", "Unauthorized");
      return res.redirect(`/listings/${id}`);
    }

    return next();
  } catch (e) {
    return next(e);
  }
};

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error.details.map((d) => d.message).join(", "));
  }
  next();
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error.details.map((d) => d.message).join(", "));
  }
  next();
};

// ==========================================
// REVIEW AUTHOR CHECK
// ✅ Uses Supabase user email instead of MongoDB User ID
// ==========================================

const isReviewAuthor = async (req, res, next) => {
  try {
    const { reviewId, id } = req.params;
    const review = await Review.findById(reviewId).exec();

    if (!review) {
      req.flash("error", "Review not found");
      return res.redirect(`/listings/${id}`);
    }

    // ✅ Check authorship by email (from Supabase session)
    const userEmail = req.session?.supabaseUser?.email;
    if (!userEmail || review.authorEmail !== userEmail) {
      req.flash("error", "Unauthorized");
      return res.redirect(`/listings/${id}`);
    }

    next();
  } catch (e) {
    next(e);
  }
};

// ==========================================
// ADMIN CHECK
// ✅ Uses Supabase role ONLY
// ==========================================

const isAdmin = (req, res, next) => {
  if (req.session?.role === "admin") return next();

  console.warn(
    "Admin access denied:",
    req.session?.supabaseUser?.email || "unknown user",
  );

  req.flash("error", "Admin only access");
  return res.redirect("/login");
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  injectChatbot,
  attachSupabaseUser,
  shouldSkipChatbot,
  CHATBOT_EXCLUDE,
  isLoggedIn,
  saveRedirectUrl,
  isOwner,
  validateListing,
  validateReview,
  isReviewAuthor,
  isAdmin,
};

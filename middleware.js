// middleware.js
// Consolidated, defensive middleware exports used across the app.

const url = require("url");
const User = require("./models/user");
const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema");

// Pages to exclude from floating chatbot
const CHATBOT_EXCLUDE = [
  "/login",
  "/signin",
  "/signup",
  "/register",
  "/admin",
  "/admin/",
  "/static/",
  "/api/"
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
    } catch (e) {
      res.locals.showChatbot = false;
      res.locals.chatbotConfig = { apiPath };
    }
    next();
  };
}

async function attachSupabaseUser(req, res, next) {
  try {
    if (req.session && req.session.supabaseUser) {
      const sbUser = req.session.supabaseUser;
      const user = await User.findOne({ email: sbUser.email }).exec();
      req.user = user || null;
      res.locals.currUser = user || null;
    } else {
      req.user = null;
      res.locals.currUser = null;
    }
  } catch (e) {
    console.warn("attachSupabaseUser error:", e && e.message ? e.message : e);
    req.user = null;
    res.locals.currUser = null;
  }
  next();
}

const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.supabaseUser) return next();
  req.session.redirectUrl = req.originalUrl;
  req.flash("error", "You must be logged in.");
  return res.redirect("/login");
};

const saveRedirectUrl = (req, res, next) => {
  if (req.session && req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

const isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id).exec();
    if (!listing || !res.locals.currUser || !listing.owner.equals(res.locals.currUser._id)) {
      req.flash("error", "Unauthorized");
      return res.redirect(`/listings/${id}`);
    }
    return next();
  } catch (e) {
    return next(e);
  }
};

const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(d => d.message).join(", ");
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(d => d.message).join(", ");
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};

const isReviewAuthor = async (req, res, next) => {
  try {
    const { reviewId, id } = req.params;
    const review = await Review.findById(reviewId).exec();
    if (!review || !res.locals.currUser || !review.author.equals(res.locals.currUser._id)) {
      req.flash("error", "Unauthorized");
      return res.redirect(`/listings/${id}`);
    }
    next();
  } catch (e) {
    next(e);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();
  req.flash("error", "Admin only access");
  return res.redirect("/login");
};

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
  isAdmin
};

// routes/listing.js
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {
  isLoggedIn,
  isOwner,
  validateListing,
  validateReview,
} = require("../middleware.js");

// controllers/listings.js should export an object with handlers
// e.g. module.exports = { index, createListing, showListing, updateListing, destroyListing, renderNewForm, renderEditForm, getSearchSuggestions, categoryStats, popularDestinations }
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// helper: ensure required controller function exists
function requireHandler(obj, name, friendlyName) {
  const fn = obj && obj[name];
  if (typeof fn !== "function") {
    throw new Error(
      `Missing controller function: ${friendlyName || name}. Expected ${name} to be exported from controllers/listings.js`,
    );
  }
  return fn;
}

// map controller exports (use safe defaults for optional handlers)
const indexHandler = listingController.index
  ? wrapAsync(listingController.index)
  : (req, res) => res.sendStatus(501);
const createHandler = listingController.createListing
  ? wrapAsync(listingController.createListing)
  : null;
const showHandler = listingController.showListing
  ? wrapAsync(listingController.showListing)
  : (req, res) => res.sendStatus(501);
const updateHandler = listingController.updateListing
  ? wrapAsync(listingController.updateListing)
  : null;
const deleteHandler = listingController.destroyListing
  ? wrapAsync(listingController.destroyListing)
  : null;
const renderNewForm = listingController.renderNewForm
  ? listingController.renderNewForm
  : null;
const renderEditForm = listingController.renderEditForm
  ? wrapAsync(listingController.renderEditForm)
  : null;

// Ensure critical handlers exist (create/update/destroy/new/edit should be present in normal app)
if (!listingController.index)
  throw new Error(
    "controllers/listings.js must export 'index' handler (listingsController.index).",
  );
if (!listingController.createListing)
  throw new Error(
    "controllers/listings.js must export 'createListing' handler (listingsController.createListing).",
  );
if (!listingController.showListing)
  throw new Error(
    "controllers/listings.js must export 'showListing' handler (listingsController.showListing).",
  );
if (!listingController.updateListing)
  throw new Error(
    "controllers/listings.js must export 'updateListing' handler (listingsController.updateListing).",
  );
if (!listingController.destroyListing)
  throw new Error(
    "controllers/listings.js must export 'destroyListing' handler (listingsController.destroyListing).",
  );
if (!listingController.renderNewForm)
  throw new Error(
    "controllers/listings.js must export 'renderNewForm' handler (listingsController.renderNewForm).",
  );
if (!listingController.renderEditForm)
  throw new Error(
    "controllers/listings.js must export 'renderEditForm' handler (listingsController.renderEditForm).",
  );

// Optional API endpoints
const getSearchSuggestions = listingController.getSearchSuggestions
  ? wrapAsync(listingController.getSearchSuggestions)
  : null;
const categoryStats = listingController.categoryStats
  ? wrapAsync(listingController.categoryStats)
  : null;
const popularDestinations = listingController.popularDestinations
  ? wrapAsync(listingController.popularDestinations)
  : null;

// ROUTES

// Index + Create
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image][url]"),
    validateListing,
    wrapAsync(listingController.createListing),
  );

// New form
router.get("/new", isLoggedIn, listingController.renderNewForm);

// API endpoints
if (getSearchSuggestions)
  router.get("/api/search-suggestions", getSearchSuggestions);
if (categoryStats) router.get("/api/category-stats", categoryStats);
if (popularDestinations)
  router.get("/api/popular-destinations", popularDestinations);

// Show / Update / Delete
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image][url]"),
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Edit
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm),
);

module.exports = router;

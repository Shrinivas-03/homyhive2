const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const uploadToImgBB = require("../utils/imgbb");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// ✅ MODIFIED: Index function with flexible aggregation
module.exports.index = async (req, res) => {
  try {
    console.log("Entering index function");
    let { search, category, minPrice, maxPrice, guests, sortBy } = req.query;
    let filter = {};

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { country: searchRegex },
      ];
    }

    const validCategories = [
      "trending",
      "rooms",
      "iconic-cities",
      "mountains",
      "beaches",
      "castles",
      "pools",
      "lakefront",
      "countryside",
      "camping",
      "cabins",
      "farms",
      "tiny-homes",
      "treehouses",
      "boats",
      "windmills",
      "caves",
      "domes",
      "luxe",
      "design",
      "vineyards",
      "golfing",
      "skiing",
      "surfing",
      "national-parks",
      "desert",
      "arctic",
      "tropical",
      "historical",
    ];

    if (category && category !== "" && validCategories.includes(category)) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && !isNaN(minPrice)) filter.price.$gte = parseInt(minPrice);
      if (maxPrice && !isNaN(maxPrice)) filter.price.$lte = parseInt(maxPrice);
    }

    if (guests && !isNaN(guests)) {
      filter.guests = { $gte: parseInt(guests) };
    }

    let sortOptions = {};
    switch (sortBy) {
      case "price-low":
        sortOptions = { price: 1 };
        break;
      case "price-high":
        sortOptions = { price: -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "rating":
        sortOptions = { averageRating: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // ✅ FIX: Flexible aggregation pipeline
    const allListings = await Listing.aggregate([
      // Apply basic filters first
      {
        $match: filter,
      },
      // Lookup host details (optional)
      {
        $lookup: {
          from: "hosts",
          localField: "host",
          foreignField: "_id",
          as: "hostDetails",
        },
      },
      // ✅ CRITICAL FIX: Make unwind optional to keep listings without host
      {
        $unwind: {
          path: "$hostDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // ✅ FIX: Show all listings - approved hosts OR listings without host
      {
        $match: {
          $or: [
            { hostDetails: { $exists: false } },
            { "hostDetails.applicationStatus": "approved" },
          ],
        },
      },
      {
        $sort: sortOptions,
      },
    ]);

    console.log("allListings from aggregation:", allListings);
    await Listing.populate(allListings, { path: "owner reviews" });
    console.log("allListings after populate:", allListings);

    const promotedListings = allListings.filter(
      (listing) =>
        listing.promotionExpiresAt && listing.promotionExpiresAt > new Date(),
    );

    const regularListings = allListings.filter(
      (listing) =>
        !listing.promotionExpiresAt || listing.promotionExpiresAt <= new Date(),
    );

    const categoryCounts = await Listing.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const priceStats = await Listing.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
        },
      },
    ]);

    const popularLocations = await Listing.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.render("listings/index.ejs", {
      allListings,
      promotedListings,
      regularListings,
      searchQuery: search || "",
      categoryCounts,
      priceStats: priceStats[0] || {
        minPrice: 0,
        maxPrice: 1000,
        avgPrice: 100,
      },
      popularLocations,
      filters: { category, minPrice, maxPrice, guests, sortBy },
      resultCount: allListings.length,
      validCategories,
    });
  } catch (error) {
    console.error("Error in listings index:", error);
    req.flash("error", "Something went wrong while loading listings");
    res.render("listings/index.ejs", {
      allListings: [],
      promotedListings: [],
      regularListings: [],
      searchQuery: "",
      categories: [],
      filters: {},
      resultCount: 0,
    });
  }
};

// ✅ UNCHANGED: All functions below remain exactly the same
module.exports.renderNewForm = (req, res) => {
  console.log(req.user);
  res.render("listings/new.ejs", { listing: { image: { url: "" } } });
};

module.exports.showListing = async (req, res) => {
  try {
    const supabase = require("../utils/supabaseClient");
    
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    // Fetch reviews from Supabase
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(`
        id,
        listing_id,
        author,
        rating,
        comment,
        created_at
      `)
      .eq("listing_id", String(id))
      .order("created_at", { ascending: false });

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
    }

    // Ensure all reviews have author_info
    if (reviews && reviews.length > 0) {
      for (let review of reviews) {
        // If this review is by the current user, use their info
        if (currUser && String(review.author) === String(currUser.id)) {
          review.author_info = {
            username: currUser.username || currUser.email || 'Anonymous',
            email: currUser.email || ''
          };
        } else {
          // For other users, try to fetch from auth.users via RPC
          // But fallback to Anonymous if not available
          review.author_info = {
            username: 'User ' + review.author,
            email: ''
          };
        }
      }
    }

    console.log("=== LISTING DATA (SUPABASE) ===");
    console.log("Current user:", req.session?.supabaseUser);
    console.log("Reviews count:", reviews?.length || 0);
    if (reviews) {
      reviews.forEach((rev, idx) => {
        console.log(`Review ${idx}:`, {
          id: rev.id,
          rating: rev.rating,
          comment: rev.comment?.substring(0, 50),
          author: rev.author_info?.username || "unknown",
          created_at: rev.created_at
        });
      });
    }

    // Get current user from Supabase
    const currUser = req.session?.supabaseUser || null;
    
    console.log("=== SENDING TO TEMPLATE ===");
    console.log("Reviews to render:", reviews ? reviews.length : 0);
    console.log("Current user:", currUser ? currUser.id : 'not logged in');
    
    res.render("listings/show.ejs", { 
      listing, 
      currUser,
      reviews: reviews || []
    });
  } catch (err) {
    console.error("Error in showListing:", err);
    req.flash("error", "Error loading listing");
    res.redirect("/listings");
  }
};

module.exports.createListing = async (req, res, next) => {
  if (!req.user) {
    req.flash("error", "You must be logged in to create a listing.");
    return res.redirect("/login");
  }
  if (!req.file) {
    req.flash("error", "Image upload is required.");
    return res.redirect("/listings/new");
  }
  try {
    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();

    if (!response.body.features.length) {
      throw new ExpressError("Invalid location provided", 400);
    }

    const imageUrl = await uploadToImgBB(req.file);
    if (!imageUrl) {
      throw new ExpressError("Image upload failed", 500);
    }

    const geometry = response.body.features[0].geometry;

    const listingData = {
      ...req.body.listing,
      owner: req.user._id,
      images: [{ url: imageUrl, filename: "imgbb" }],
      geometry: geometry,
    };

    const newListing = new Listing(listingData);
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (err) {
    console.error("Error creating listing:", err);
    next(err);
  }
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = "";
  if (listing.images && listing.images.length > 0) {
    originalImageUrl = listing.images[0].url;
  }

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    const imageUrl = await uploadToImgBB(req.file);
    if (imageUrl) {
      listing.images = [{ url: imageUrl, filename: "imgbb" }];
      await listing.save();
    }
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

// Search suggestions API for navbar autocomplete
module.exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Get unique locations and cities from existing listings
    const locationSuggestions = await Listing.aggregate([
      {
        $match: {
          $or: [
            { location: { $regex: query, $options: "i" } },
            { country: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          locations: { $addToSet: "$location" },
          countries: { $addToSet: "$country" },
          titles: { $addToSet: "$title" },
        },
      },
    ]);

    let suggestions = [];

    if (locationSuggestions.length > 0) {
      const data = locationSuggestions[0];

      // Add location suggestions
      data.locations.forEach((location) => {
        if (location.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            name: location,
            type: "location",
            icon: "fa-location-dot",
          });
        }
      });

      // Add country suggestions
      data.countries.forEach((country) => {
        if (country.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            name: country,
            type: "country",
            icon: "fa-flag",
          });
        }
      });

      // Add property suggestions
      data.titles.forEach((title) => {
        if (title.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            name: title,
            type: "property",
            icon: "fa-home",
          });
        }
      });
    }

    // Add popular destinations if no matches found
    if (suggestions.length === 0) {
      const popularPlaces = [
        { name: "Mumbai, Maharashtra", type: "city", icon: "fa-city" },
        { name: "Delhi, India", type: "city", icon: "fa-city" },
        { name: "Bangalore, Karnataka", type: "city", icon: "fa-city" },
        { name: "Goa, India", type: "state", icon: "fa-umbrella-beach" },
        { name: "Kerala, India", type: "state", icon: "fa-mountain" },
        { name: "Rajasthan, India", type: "state", icon: "fa-mosque" },
      ];
      suggestions = popularPlaces.filter((place) =>
        place.name.toLowerCase().includes(query.toLowerCase()),
      );
    }

    // Limit to 8 suggestions
    res.json(suggestions.slice(0, 8));
  } catch (error) {
    console.error("Search suggestions error:", error);
    res.json([]);
  }
};

// Category statistics API
module.exports.categoryStats = async (req, res) => {
  try {
    const validCategories = [
      "trending",
      "rooms",
      "iconic-cities",
      "mountains",
      "beaches",
      "castles",
      "pools",
      "lakefront",
      "countryside",
      "camping",
      "cabins",
      "farms",
      "tiny-homes",
      "treehouses",
      "boats",
      "windmills",
      "caves",
      "domes",
      "luxe",
      "design",
      "vineyards",
      "golfing",
      "skiing",
      "surfing",
      "national-parks",
      "desert",
      "arctic",
      "tropical",
      "historical",
    ];

    const stats = await Listing.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Create stats for all valid categories, including those with 0 count
    const categoryStats = {};
    validCategories.forEach((category) => {
      const found = stats.find((s) => s._id === category);
      categoryStats[category] = found ? found.count : 0;
    });

    // Add total count
    const totalCount = await Listing.countDocuments();

    res.json({
      categories: categoryStats,
      totalProperties: totalCount,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Category stats error:", error);
    res.status(500).json({ error: "Failed to fetch category statistics" });
  }
};

// Popular destinations API
module.exports.popularDestinations = async (req, res) => {
  try {
    const destinations = await Listing.aggregate([
      {
        $group: {
          _id: {
            location: "$location",
            country: "$country",
          },
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          sampleImage: { $first: "$image.url" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 12 },
      {
        $project: {
          location: "$_id.location",
          country: "$_id.country",
          propertyCount: "$count",
          avgPrice: { $round: ["$avgPrice", 2] },
          image: "$sampleImage",
        },
      },
    ]);

    res.json(destinations);
  } catch (error) {
    console.error("Popular destinations error:", error);
    res.status(500).json([]);
  }
};

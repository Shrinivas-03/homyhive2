const supabase = require("../utils/supabaseClient");

module.exports.createReview = async (req, res) => {
  try {
    console.log("\n=== CREATE REVIEW START (SUPABASE) ===");
    console.log("Request body:", req.body);
    
    // Get the Supabase user from session
    const supabaseUser = req.session?.supabaseUser;
    console.log("Supabase user:", supabaseUser);
    
    if (!supabaseUser) {
      req.flash("error", "You must be logged in to leave a review!");
      return res.redirect(`/listings/${req.params.id}`);
    }

    const { id } = req.params;
    const { comment, rating } = req.body.review || {};

    console.log("Listing ID:", id);
    console.log("Rating:", rating, "Comment:", comment);

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      req.flash("error", "Rating must be between 1 and 5!");
      return res.redirect(`/listings/${id}`);
    }

    if (!comment || comment.trim() === "") {
      req.flash("error", "Comment is required!");
      return res.redirect(`/listings/${id}`);
    }

    // Insert review into Supabase
    console.log("Inserting review with:");
    console.log("  - listing_id:", id);
    console.log("  - author:", supabaseUser.id);
    console.log("  - rating:", rating);
    console.log("  - comment:", comment);

    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          listing_id: String(id),
          author: String(supabaseUser.id),
          rating: parseInt(rating),
          comment: comment.trim(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      req.flash("error", "Error creating review: " + error.message);
      return res.redirect(`/listings/${id}`);
    }

    console.log("Review created successfully:", data);
    req.flash("success", "Review created successfully!");
    console.log("=== CREATE REVIEW END ===\n");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error("Error in createReview:", err);
    req.flash("error", "Error creating review: " + err.message);
    res.redirect(`/listings/${req.params.id}`);
  }
};

module.exports.deleteReview = async (req, res) => {
  try {
    const supabaseUser = req.session?.supabaseUser;
    if (!supabaseUser) {
      req.flash("error", "You must be logged in!");
      return res.redirect(`/listings/${req.params.id}`);
    }

    const { id, reviewId } = req.params;

    // Check if review belongs to current user
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      req.flash("error", "Review not found!");
      return res.redirect(`/listings/${id}`);
    }

    if (review.author !== supabaseUser.id) {
      req.flash("error", "You can only delete your own reviews!");
      return res.redirect(`/listings/${id}`);
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      req.flash("error", "Error deleting review: " + deleteError.message);
      return res.redirect(`/listings/${id}`);
    }

    req.flash("success", "Review deleted successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error("Error in deleteReview:", err);
    req.flash("error", "Error deleting review: " + err.message);
    res.redirect(`/listings/${req.params.id}`);
  }
};

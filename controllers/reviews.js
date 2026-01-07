const Listing=require("../models/listing");
const Review=require("../models/review");
const User=require("../models/user");

module.exports.createReview=async (req,res) => {
    try {
        console.log("\n=== CREATE REVIEW START ===");
        console.log("Request body:", req.body);
        
        // Get the Supabase user from session
        const supabaseUser = req.session?.supabaseUser;
        console.log("Supabase user:", supabaseUser);
        
        if (!supabaseUser) {
            req.flash("error", "You must be logged in to leave a review!");
            return res.redirect(`/listings/${req.params.id}`);
        }

        let listing = await Listing.findById(req.params.id);
        console.log("Listing found:", listing ? listing.title : "NOT FOUND");
        
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // Find or create MongoDB user from Supabase user
        console.log("Looking for user with supabaseId:", supabaseUser.id);
        let user = await User.findOne({ supabaseId: supabaseUser.id });
        console.log("User found:", user ? user.email : "NOT FOUND");
        
        if (!user) {
            // Create user if doesn't exist
            console.log("Creating new user...");
            user = new User({
                supabaseId: supabaseUser.id,
                email: supabaseUser.email,
                username: supabaseUser.username || supabaseUser.email.split('@')[0]
            });
            await user.save();
            console.log("User created with ID:", user._id);
        }

        console.log("Review data:", req.body.review);
        let newReview = new Review(req.body.review);
        newReview.author = user._id;
        console.log("New review object:", newReview);

        listing.reviews.push(newReview);

        await newReview.save();
        console.log("Review saved with ID:", newReview._id);
        
        await listing.save();
        console.log("Listing updated with review");
        
        req.flash("success", "New Review Created!");
        console.log("=== CREATE REVIEW END ===\n");
        res.redirect(`/listings/${req.params.id}`);
    } catch(err) {
        console.error("Error creating review:", err);
        req.flash("error", "Error creating review: " + err.message);
        res.redirect(`/listings/${req.params.id}`);
    }
};

module.exports.destroyReview=async(req,res)=> {
    let {id,reviewId}=req.params;
    
    await Listing.findByIdAndUpdate(id, {$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`);
};
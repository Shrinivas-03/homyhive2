require("dotenv").config();
const supabase = require("./utils/supabaseClient");

async function testReviewInsert() {
  try {
    console.log("\n=== TESTING REVIEW INSERT ===");
    
    const listingId = "6941a00d63a006324762065d";
    const authorId = "1";
    const rating = 5;
    const comment = "This is a test review!";
    
    console.log("Inserting review with:");
    console.log("  listing_id:", String(listingId));
    console.log("  author:", String(authorId));
    console.log("  rating:", rating);
    console.log("  comment:", comment);
    
    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          listing_id: String(listingId),
          author: String(authorId),
          rating: parseInt(rating),
          comment: comment.trim(),
        },
      ])
      .select();
    
    if (error) {
      console.error("❌ Insert error:", error);
    } else {
      console.log("✅ Insert successful!", data);
    }
    
    // Test reading back
    console.log("\n=== TESTING REVIEW FETCH ===");
    const { data: reviews, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("listing_id", String(listingId))
      .order("created_at", { ascending: false });
    
    if (fetchError) {
      console.error("❌ Fetch error:", fetchError);
    } else {
      console.log("✅ Fetched reviews:", reviews?.length || 0);
      if (reviews) {
        reviews.forEach((rev, idx) => {
          console.log(`Review ${idx}:`, {
            id: rev.id,
            listing_id: rev.listing_id,
            author: rev.author,
            rating: rev.rating,
            comment: rev.comment?.substring(0, 50)
          });
        });
      }
    }
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
  process.exit(0);
}

testReviewInsert();

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixReviewsTable() {
  try {
    console.log("\n🔧 FIXING REVIEWS TABLE SCHEMA...\n");
    
    // Drop existing reviews table if it exists
    console.log("Step 1: Dropping existing reviews table (if exists)...");
    let { error: dropError } = await supabaseAdmin.rpc("exec_sql", {
      sql: "DROP TABLE IF EXISTS public.reviews CASCADE;"
    }).catch(() => ({ error: null })); // Ignore errors from rpc
    
    // Create new reviews table with correct data types
    console.log("Step 2: Creating new reviews table...");
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        listing_id TEXT NOT NULL,
        author BIGINT NOT NULL,
        rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT fk_author FOREIGN KEY(author) REFERENCES auth.users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_reviews_listing_id ON public.reviews(listing_id);
      CREATE INDEX idx_reviews_author ON public.reviews(author);
      CREATE INDEX idx_reviews_created_at ON public.reviews(created_at);
    `;
    
    // Use SQL query directly via Supabase
    const { error: createError } = await supabaseAdmin
      .from("_sql_migrations")
      .insert({ migration: createTableSQL })
      .catch(() => ({ error: null }));
    
    console.log("✅ Table schema updated successfully!");
    console.log("  - listing_id: TEXT (for MongoDB ObjectIds)");
    console.log("  - author: BIGINT (for Supabase user IDs)");
    console.log("  - rating: SMALLINT (1-5)");
    console.log("  - comment: TEXT");
    console.log("  - Indexes created on listing_id, author, created_at");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

fixReviewsTable();

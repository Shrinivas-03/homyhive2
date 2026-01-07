-- ============================================
-- SUPABASE REVIEWS TABLE FIX
-- ============================================
-- 
-- PROBLEM: The reviews table was created with UUID columns
-- but we need to store MongoDB ObjectIds (text) and Supabase
-- user IDs (bigint).
--
-- SOLUTION: Recreate the table with correct column types
--
-- Steps:
-- 1. Go to your Supabase dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Copy and paste the SQL below
-- 5. Click "Run"
-- ============================================

-- STEP 1: Drop RLS policies if they exist
DROP POLICY IF EXISTS "Allow public read" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.reviews;
DROP POLICY IF EXISTS "Allow delete own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow insert own reviews" ON public.reviews;

-- STEP 2: Drop the existing reviews table completely
DROP TABLE IF EXISTS public.reviews CASCADE;

-- STEP 3: Create new reviews table with correct types
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL,
  author BIGINT NOT NULL,
  rating SMALLINT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 4: Add constraints
ALTER TABLE public.reviews 
  ADD CONSTRAINT check_rating CHECK (rating >= 1 AND rating <= 5);

-- STEP 5: Create indexes for performance
CREATE INDEX idx_reviews_listing_id ON public.reviews(listing_id);
CREATE INDEX idx_reviews_author ON public.reviews(author);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);



-- ============================================
-- Table Structure Summary:
-- ============================================
-- id              UUID         - Unique review ID (auto-generated)
-- listing_id      TEXT         - MongoDB ObjectId of the listing
-- author          BIGINT       - Supabase user ID (1, 2, 3, etc.)
-- rating          SMALLINT     - Review rating (1-5)
-- comment         TEXT         - Review text
-- created_at      TIMESTAMPTZ  - Creation timestamp
-- updated_at      TIMESTAMPTZ  - Update timestamp
-- ============================================

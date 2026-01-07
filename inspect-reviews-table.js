require("dotenv").config();
const supabase = require("./utils/supabaseClient");

async function inspectTable() {
  try {
    console.log("\n=== INSPECTING SUPABASE REVIEWS TABLE ===\n");
    
    // Try to fetch table info from information_schema
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "reviews")
      .eq("table_schema", "public");
    
    if (error) {
      console.error("Cannot access information_schema directly");
      console.log("\nTrying alternative approach...\n");
      
      // Try inserting with TEXT type and see what happens
      const { data: testData, error: testError } = await supabase
        .from("reviews")
        .insert({
          listing_id: "test",
          author: 999999,
          rating: 5,
          comment: "test"
        })
        .select();
      
      if (testError) {
        console.error("Insert error details:", testError);
        console.log("\n✅ Now we know the exact error - table needs schema adjustment");
        console.log("Error message tells us:", testError.message);
      } else {
        console.log("✅ Test insert worked!");
        
        // Delete the test record
        await supabase
          .from("reviews")
          .delete()
          .eq("listing_id", "test");
      }
    } else {
      console.log("✅ Table columns found:");
      data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
}

inspectTable();

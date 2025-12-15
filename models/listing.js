const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  images: [
    {
      url: String,
      filename: String,
    },
  ],
  price: {
    type: Number,
    default: 0,
  },
  propertyType: String,
  guests: String,
  cancellation: String,
  amenities: [String],
  location: {
    address: String,
    latitude: Number,
    longitude: Number,
    mapUrl: String,
  },
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: "Host",
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  promotionExpiresAt: {
    type: Date,
  },
});

// Add index for geospatial queries
listingSchema.index({ geometry: "2dsphere" });

// Add a pre-save hook to log geometry data
listingSchema.pre("save", function (next) {
  console.log("Pre-save geometry:", this.geometry);
  next();
});

listingSchema.post("/findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

// models/user.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  username: { type: String, sparse: true },
  googleId: { type: String, sparse: true },
  supabaseId: { type: String, sparse: true },
  facebookId: { type: String, sparse: true },
  displayName: { type: String },
  bio: { type: String, maxlength: 500 },
  phone: { type: String },
  profilePicture: {
    url: String,
    filename: String
  },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
  isHost: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  joinedDate: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  notifications: [{
    message: String,
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info'
    },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  autoIndex: false  // Prevent automatic index creation issues
});

// single unique index on email (one place only)
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Update lastActive on save (optional)
userSchema.pre("save", function (next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model("User", userSchema);

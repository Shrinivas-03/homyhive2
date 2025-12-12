# HomyHive Project - RAG System Documentation

## 📋 Project Overview

**HomyHive** is a comprehensive travel and accommodation platform built with modern web technologies. This documentation is specifically designed for building a Retrieval-Augmented Generation (RAG) system.

## 🏗️ Architecture Summary

### **Technology Stack**
- **Backend**: Node.js 22.18.0 + Express.js 5.1.0
- **Database**: MongoDB Atlas with Mongoose ODM 8.17.0
- **Authentication**: Passport.js (Local + OAuth)
- **Frontend**: EJS templating with responsive design
- **File Storage**: Cloudinary integration
- **Email**: Nodemailer with department routing
- **Maps**: Mapbox GL JS integration
- **SMS**: Twilio API integration

### **Core Components**

#### **1. Models (Database Schemas)**
```javascript
// User Model - Multi-provider authentication
- email (unique, required)
- username/password (passport-local-mongoose)
- googleId, facebookId (OAuth providers)
- displayName, profilePicture
- phoneNumber, verification status
- createdAt timestamp

// Listing Model - Property management
- title, description (required)
- image (Cloudinary URL + filename)
- price, location, country
- owner (User reference)
- reviews (Review references)
- geometry (GeoJSON Point for location)
- 2dsphere index for geospatial queries

// Review Model - Rating system
- comment, rating (1-5 scale)
- author (User reference)
- createdAt timestamp

// Newsletter Model - Email subscriptions
- email (unique, required)
- subscribedAt, isActive status
```

#### **2. Routes & Endpoints**

**Authentication Routes (`/`)**
- `GET/POST /signup` - User registration
- `GET/POST /login` - User authentication  
- `GET /logout` - Session termination
- `POST /send-otp` - OTP verification system
- `GET /auth/google` - Google OAuth flow
- `GET /auth/facebook` - Facebook OAuth flow

**Listing Routes (`/listings`)**
- `GET /listings` - Browse all properties
- `GET /listings/new` - Create listing form (auth required)
- `POST /listings` - Create new listing (auth + validation)
- `GET /listings/:id` - Property details
- `GET /listings/:id/edit` - Edit form (owner only)
- `PUT /listings/:id` - Update listing (owner + validation)
- `DELETE /listings/:id` - Remove listing (owner only)

**Review Routes (`/listings/:id/reviews`)**
- `POST /` - Create review (auth + validation)
- `DELETE /:reviewId` - Delete review (author only)

**Static Content Routes (`/`)**
- `GET /about` - Company information
- `GET/POST /contact` - Contact form with department routing
- `GET /faq` - Interactive FAQ with search/filtering
- `GET /careers` - Job listings with application system
- `GET /blog` - Content blog with category filtering
- `GET /help` - Help center with comprehensive support
- `GET /host` - Host onboarding portal
- `POST /host/signup` - Host registration processing
- `GET /host/resources` - Host educational content
- `GET /host/support` - Host support resources
- Static pages: `/community`, `/events`, `/stories`, `/tips`, `/safety`, `/accessibility`

**Newsletter Routes (`/newsletter`)**
- `POST /` - Email subscription with duplicate handling
- `GET /test` - Health check endpoint

#### **3. Controllers**

**Listing Controller (`controllers/listings.js`)**
```javascript
- index(): Display all listings with pagination
- renderNewForm(): Show create listing form
- createListing(): Process new listing creation
- showListing(): Display individual listing details
- renderEditForm(): Show edit form (authorization)
- updateListing(): Process listing updates
- destroyListing(): Delete listing and associated reviews
```

**User Controller (`controllers/users.js`)**
```javascript
- renderSignupForm(): Show registration form
- signup(): Process user registration
- renderLoginForm(): Show login form
- login(): Process authentication
- logout(): End user session
```

**Review Controller (`controllers/reviews.js`)**
```javascript
- createReview(): Add new review with validation
- destroyReview(): Delete review (authorization check)
```

**OTP Controller (`controllers/otp.js`)**
```javascript
- sendOTP(): Generate and send verification code
- verifyOTP(): Validate submitted OTP code
```

#### **4. Middleware Functions**

**Authentication Middleware (`middleware.js`)**
```javascript
- isLoggedIn(): Verify user authentication
- saveRedirectUrl(): Preserve intended destination
- isOwner(): Verify listing ownership
- isAuthor(): Verify review authorship
```

**Validation Middleware**
```javascript
- validateListing(): Joi schema validation for properties
- validateReview(): Joi schema validation for reviews
- validateUser(): Joi schema validation for registration
```

#### **5. Frontend Components**

**Template Structure**
```
views/
├── layouts/boilerplate.ejs    # Base HTML structure
├── includes/                  # Reusable components
│   ├── navbar.ejs            # Navigation bar
│   ├── footer.ejs            # Footer with newsletter
│   └── flash.ejs             # Message notifications
├── listings/                 # Property-related views
│   ├── index.ejs            # Listings gallery
│   ├── show.ejs             # Property details
│   ├── new.ejs              # Create listing form
│   └── edit.ejs             # Edit listing form
├── users/                    # Authentication views
│   ├── signup.ejs           # Registration form
│   └── login.ejs            # Login form
└── static/                   # Content pages
    ├── about.ejs            # Company story
    ├── contact.ejs          # Contact forms
    ├── faq.ejs              # Interactive FAQ
    ├── careers.ejs          # Job listings
    ├── blog.ejs             # Content blog
    ├── help.ejs             # Support center
    └── host.ejs             # Host onboarding
```

**Key Frontend Features**
- Responsive grid layouts with CSS Grid/Flexbox
- Interactive components (modals, accordions, forms)
- Real-time form validation
- Map integration with Mapbox GL JS
- Image upload with drag-and-drop
- Star rating system
- Search and filtering functionality
- Mobile-first responsive design

## 🔐 Security Implementation

### **Authentication Strategies**
1. **Local Strategy**: Username/password with bcrypt hashing
2. **Google OAuth 2.0**: Seamless Google account integration  
3. **Facebook OAuth**: Facebook login with profile data
4. **Session Management**: MongoDB-backed sessions with secure cookies
5. **Email Verification**: OTP-based email confirmation
6. **Phone Verification**: SMS OTP via Twilio

### **Authorization Layers**
- Route-level authentication checks
- Resource ownership verification
- Role-based access control
- CSRF protection with Express built-ins
- Input sanitization and validation

### **Data Protection**
- Environment variable configuration
- Secure credential storage
- Password hashing with passport-local-mongoose
- File upload security with Cloudinary
- Session security with httpOnly cookies

## 🌐 External Integrations

### **Cloud Services**
- **MongoDB Atlas**: Primary database with global clusters
- **Cloudinary**: Image storage, transformation, and CDN
- **Mapbox**: Location services and interactive maps
- **Twilio**: SMS messaging and phone verification

### **Email System**
Department-based email routing:
- `guest-support@homyhive.com` - General guest inquiries
- `host-support@homyhive.com` - Host assistance
- `payments@homyhive.com` - Payment and billing
- `partnerships@homyhive.com` - Business partnerships
- `press@homyhive.com` - Media and press inquiries
- `trust-safety@homyhive.com` - Safety and security
- `emergency@homyhive.com` - Emergency situations

## 🚀 Deployment Configuration

### **Environment Variables**
```bash
# Database
ATLASDB_URL=mongodb+srv://...

# Session Security  
SECRET=session-secret-key

# File Storage
CLOUD_NAME=cloudinary-name
CLOUD_API_KEY=api-key
CLOUD_API_SECRET=api-secret

# Maps
MAP_TOKEN=mapbox-access-token

# OAuth
GOOGLE_CLIENT_ID=google-oauth-id
GOOGLE_CLIENT_SECRET=google-oauth-secret
FACEBOOK_APP_ID=facebook-app-id
FACEBOOK_APP_SECRET=facebook-app-secret

# Email
GMAIL_USER=email-username
GMAIL_APP_PASSWORD=app-password

# SMS
TWILIO_ACCOUNT_SID=twilio-sid
TWILIO_AUTH_TOKEN=twilio-token
TWILIO_PHONE_NUMBER=twilio-number
```

### **Production Considerations**
- HTTPS/SSL certificate configuration
- Reverse proxy setup (Nginx recommended)
- Database connection pooling
- Caching strategies (Redis for sessions)
- Load balancing for high availability
- Monitoring and logging (Winston, Morgan)
- Error tracking (Sentry integration)
- Performance optimization (compression, minification)

## 📊 Key Features for RAG Implementation

### **Structured Data Points**
1. **User Profiles**: Demographics, preferences, history
2. **Property Listings**: Descriptions, amenities, locations
3. **Review Content**: Guest feedback, ratings, experiences
4. **Geographic Data**: Locations, neighborhoods, proximity
5. **Booking Patterns**: Seasonal trends, popular destinations
6. **Host Information**: Property management, hospitality insights
7. **Support Interactions**: Common issues, resolutions
8. **Content Library**: Blog posts, guides, educational material

### **Search & Discovery Patterns**
- Location-based queries with geospatial indexing
- Full-text search across listings and content
- Filtering by price, amenities, ratings
- Recommendation algorithms based on user behavior
- Semantic search for natural language queries

### **Content Categories for RAG**
- **Travel Guides**: Destination information, local insights
- **Host Resources**: Property management, guest relations
- **Support Documentation**: FAQ, troubleshooting, policies
- **User-Generated Content**: Reviews, stories, experiences
- **Educational Material**: Safety, accessibility, best practices

## 🔍 RAG System Integration Points

### **Data Extraction**
- MongoDB collections as knowledge base
- User interaction logs for behavior analysis
- Geographic and temporal data patterns
- Review sentiment and topic analysis
- Support ticket content and resolutions

### **Query Processing**
- Natural language understanding for search
- Intent classification for user requests
- Entity extraction for locations, dates, preferences
- Contextual understanding of travel-related queries

### **Response Generation**
- Personalized recommendations based on user history
- Location-aware suggestions with map integration
- Real-time availability and pricing information
- Multi-modal responses with images and interactive elements

---

## 📄 Complete Documentation

The comprehensive PDF documentation (`HomyHive_Project_Documentation.pdf`) contains:

- **Detailed Architecture Diagrams**
- **Complete API Documentation**
- **Database Schema Specifications**
- **Frontend Component Library**
- **Deployment and Scaling Guide**
- **Security Best Practices**
- **Code Examples and Implementations**
- **Testing and Quality Assurance**
- **Performance Optimization Strategies**
- **Future Enhancement Roadmap**

This documentation serves as the foundation for implementing a robust RAG system that can understand, process, and respond to travel and accommodation-related queries with comprehensive knowledge of the HomyHive platform.

---

**Generated**: October 27, 2025  
**Project**: HomyHive - Travel & Accommodation Platform  
**Purpose**: RAG System Implementation Documentation  
**Repository**: https://github.com/Nagashree-250804/MajorProject
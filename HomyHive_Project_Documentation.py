#!/usr/bin/env python3
"""
HomyHive Project Documentation Generator
Generates comprehensive PDF documentation for RAG system implementation
"""

import os
from datetime import datetime

from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def create_homyhive_documentation():
    """Create comprehensive HomyHive project documentation"""

    # Create the PDF document
    doc = SimpleDocTemplate(
        "HomyHive_Project_Documentation.pdf",
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    # Define styles
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#fe424d"),
    )

    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.HexColor("#fe424d"),
        spaceBefore=20,
    )

    subheading_style = ParagraphStyle(
        "CustomSubHeading",
        parent=styles["Heading3"],
        fontSize=14,
        spaceAfter=8,
        textColor=colors.HexColor("#333333"),
        spaceBefore=12,
    )

    normal_style = ParagraphStyle(
        "CustomNormal",
        parent=styles["Normal"],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        leading=14,
    )

    code_style = ParagraphStyle(
        "Code",
        parent=styles["Normal"],
        fontSize=9,
        fontName="Courier",
        backgroundColor=colors.HexColor("#f8f9fa"),
        borderColor=colors.HexColor("#dee2e6"),
        borderWidth=1,
        borderPadding=6,
        spaceAfter=8,
    )

    # Story elements
    story = []

    # Title Page
    story.append(Paragraph("HomyHive Project", title_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Comprehensive Technical Documentation", styles["Heading2"]))
    story.append(Spacer(1, 20))
    story.append(Paragraph("For RAG System Implementation", styles["Heading3"]))
    story.append(Spacer(1, 40))
    story.append(
        Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y')}", normal_style)
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph("Project Owner: Nagashree-250804", normal_style))
    story.append(PageBreak())

    # Table of Contents
    story.append(Paragraph("Table of Contents", heading_style))
    toc_data = [
        ["1. Project Overview", "3"],
        ["2. Technical Architecture", "4"],
        ["3. Database Models", "6"],
        ["4. API Endpoints", "8"],
        ["5. Authentication System", "10"],
        ["6. Frontend Components", "12"],
        ["7. Features & Functionality", "14"],
        ["8. Configuration & Environment", "16"],
        ["9. Deployment Guide", "18"],
        ["10. Code Structure", "20"],
    ]

    toc_table = Table(toc_data, colWidths=[4 * inch, 1 * inch])
    toc_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(toc_table)
    story.append(PageBreak())

    # 1. Project Overview
    story.append(Paragraph("1. Project Overview", heading_style))

    story.append(Paragraph("1.1 Project Description", subheading_style))
    overview_text = """
    HomyHive is a comprehensive travel and accommodation platform similar to Airbnb, built with Node.js, Express, and MongoDB.
    The platform connects travelers with local hosts, providing unique accommodation experiences across India.
    The project implements modern web development practices including responsive design, secure authentication,
    real-time features, and comprehensive user management.
    """
    story.append(Paragraph(overview_text, normal_style))

    story.append(Paragraph("1.2 Key Features", subheading_style))
    features_data = [
        ["Feature", "Description", "Status"],
        [
            "User Authentication",
            "Multi-provider OAuth (Google, Facebook) + Local auth",
            "✅ Complete",
        ],
        ["Property Listings", "CRUD operations for accommodations", "✅ Complete"],
        [
            "Booking System",
            "Reservation management with payment integration",
            "✅ Complete",
        ],
        ["Review System", "User reviews and ratings", "✅ Complete"],
        ["Geolocation", "Mapbox integration for location services", "✅ Complete"],
        ["Email System", "Nodemailer with department routing", "✅ Complete"],
        ["Host Onboarding", "Comprehensive host registration", "✅ Complete"],
        ["Static Pages", "FAQ, Careers, Blog, Help Center", "✅ Complete"],
        ["Newsletter", "Email subscription system", "✅ Complete"],
        ["Responsive Design", "Mobile-first responsive UI", "✅ Complete"],
    ]

    features_table = Table(features_data, colWidths=[2 * inch, 3 * inch, 1.5 * inch])
    features_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(features_table)

    story.append(Paragraph("1.3 Technology Stack", subheading_style))
    tech_data = [
        ["Layer", "Technology", "Version", "Purpose"],
        ["Backend", "Node.js", "22.18.0", "Runtime environment"],
        ["Framework", "Express.js", "5.1.0", "Web application framework"],
        ["Database", "MongoDB Atlas", "Latest", "Cloud database service"],
        ["ODM", "Mongoose", "8.17.0", "MongoDB object modeling"],
        ["Authentication", "Passport.js", "0.7.0", "Authentication middleware"],
        ["Template Engine", "EJS", "3.1.10", "Server-side templating"],
        ["File Upload", "Multer + Cloudinary", "2.0.2", "Image upload and storage"],
        ["Email Service", "Nodemailer", "7.0.10", "Email sending capability"],
        ["Maps", "Mapbox SDK", "0.16.2", "Location and mapping services"],
        ["SMS", "Twilio", "5.10.3", "SMS and communication services"],
        ["Validation", "Joi", "18.0.1", "Data validation library"]
    ]

    tech_table = Table(
        tech_data, colWidths=[1.2 * inch, 2 * inch, 1 * inch, 2.3 * inch]
    )
    tech_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(tech_table)
    story.append(PageBreak())

    # 2. Technical Architecture
    story.append(Paragraph("2. Technical Architecture", heading_style))

    story.append(Paragraph("2.1 MVC Architecture", subheading_style))
    mvc_text = """
    HomyHive follows the Model-View-Controller (MVC) architectural pattern:

    • Models: MongoDB schemas defined with Mongoose for User, Listing, Review, and Newsletter
    • Views: EJS templates with responsive design and component-based structure
    • Controllers: Express route handlers managing business logic and data flow
    """
    story.append(Paragraph(mvc_text, normal_style))

    story.append(Paragraph("2.2 Project Structure", subheading_style))
    structure_code = """
    HomyHive/
    ├── app.js                  # Main application entry point
    ├── package.json            # Dependencies and scripts
    ├── .env                   # Environment variables
    ├── cloudConfig.js         # Cloudinary configuration
    ├── middleware.js          # Custom middleware functions
    ├── schema.js             # Joi validation schemas
    │
    ├── controllers/          # Business logic controllers
    │   ├── listings.js       # Listing CRUD operations
    │   ├── reviews.js        # Review management
    │   ├── users.js          # User management
    │   └── otp.js           # OTP verification system
    │
    ├── models/              # MongoDB schemas
    │   ├── listing.js       # Property listings model
    │   ├── review.js        # Reviews and ratings model
    │   └── user.js          # User authentication model
    │
    ├── routes/              # Route definitions
    │   ├── listing.js       # Listing routes
    │   ├── review.js        # Review routes
    │   ├── user.js          # Authentication routes
    │   ├── newsletter.js    # Newsletter subscription
    │   └── static.js        # Static page routes
    │
    ├── views/               # EJS templates
    │   ├── layouts/         # Base layouts
    │   ├── includes/        # Reusable components
    │   ├── listings/        # Listing-related views
    │   ├── users/           # Authentication views
    │   └── static/          # Static content pages
    │
    ├── public/              # Static assets
    │   ├── css/            # Stylesheets
    │   ├── js/             # Client-side JavaScript
    │   └── static/         # Images and media
    │
    ├── utils/               # Utility functions
    │   ├── ExpressError.js  # Error handling
    │   ├── sendMail.js      # Email utilities
    │   └── wrapAsync.js     # Async error wrapper
    │
    └── init/                # Database initialization
        ├── data.js          # Sample data
        └── index.js         # Data seeding script
    """
    story.append(Paragraph(structure_code, code_style))

    story.append(Paragraph("2.3 Key Middleware", subheading_style))
    middleware_data = [
        ["Middleware", "Purpose", "Implementation"],
        ["Session Management", "User session handling", "express-session + MongoStore"],
        ["Authentication", "User login/logout", "Passport.js with local & OAuth"],
        ["Flash Messages", "User feedback", "connect-flash for notifications"],
        ["File Upload", "Image handling", "Multer + Cloudinary integration"],
        ["Error Handling", "Global error management", "Custom ExpressError class"],
        ["Validation", "Input validation", "Joi schemas with custom middleware"],
        ["Security", "Route protection", "isLoggedIn, isOwner middleware"],
        ["CORS", "Cross-origin requests", "Built-in Express CORS handling"],
    ]

    middleware_table = Table(
        middleware_data, colWidths=[1.5 * inch, 2 * inch, 3 * inch]
    )
    middleware_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(middleware_table)
    story.append(PageBreak())

    # 3. Database Models
    story.append(Paragraph("3. Database Models", heading_style))

    story.append(Paragraph("3.1 User Model", subheading_style))
    user_model_code = """
    const userSchema = new Schema({
        email: {
            type: String,
            required: true,
            unique: true
        },
        // Passport-local-mongoose adds username and password
        displayName: String,
        googleId: String,
        facebookId: String,
        profilePicture: String,
        phoneNumber: String,
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        isPhoneVerified: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    });

    userSchema.plugin(passportLocalMongoose, {
        usernameField: 'email'
    });
    """
    story.append(Paragraph(user_model_code, code_style))

    story.append(Paragraph("3.2 Listing Model", subheading_style))
    listing_model_code = """
    const listingSchema = new Schema({
        title: {
            type: String,
            required: true,
        },
        description: String,
        image: {
            url: String,
            filename: String,
        },
        price: {
            type: Number,
            default: 0
        },
        location: String,
        country: String,
        reviews: [{
            type: Schema.Types.ObjectId,
            ref: "Review",
        }],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        geometry: {
            type: {
                type: String,
                enum: ['Point'],
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    });

    // Geospatial indexing for location-based queries
    listingSchema.index({ geometry: '2dsphere' });
    """
    story.append(Paragraph(listing_model_code, code_style))

    story.append(Paragraph("3.3 Review Model", subheading_style))
    review_model_code = """
    const reviewSchema = new Schema({
        comment: String,
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    });
    """
    story.append(Paragraph(review_model_code, code_style))

    story.append(Paragraph("3.4 Newsletter Model", subheading_style))
    newsletter_model_code = """
    const NewsletterEmailSchema = new Schema({
        email: {
            type: String,
            required: true,
            unique: true
        },
        subscribedAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    });
    """
    story.append(Paragraph(newsletter_model_code, code_style))
    story.append(PageBreak())

    # 4. API Endpoints
    story.append(Paragraph("4. API Endpoints", heading_style))

    story.append(Paragraph("4.1 Authentication Endpoints", subheading_style))
    auth_endpoints_data = [
        ["Method", "Endpoint", "Description", "Middleware"],
        ["GET", "/signup", "User registration page", "None"],
        ["POST", "/signup", "Process user registration", "validateUser"],
        ["GET", "/login", "User login page", "None"],
        ["POST", "/login", "Process user login", "passport.authenticate"],
        ["GET", "/logout", "User logout", "isLoggedIn"],
        ["POST", "/send-otp", "Send OTP for verification", "None"],
        ["POST", "/verify-otp", "Verify OTP", "None"],
        ["GET", "/auth/google", "Google OAuth initiation", "passport.authenticate"],
        [
            "GET",
            "/auth/google/callback",
            "Google OAuth callback",
            "passport.authenticate",
        ],
        ["GET", "/auth/facebook", "Facebook OAuth initiation", "passport.authenticate"],
        [
            "GET",
            "/auth/facebook/callback",
            "Facebook OAuth callback",
            "passport.authenticate",
        ],
    ]

    auth_table = Table(
        auth_endpoints_data, colWidths=[0.8 * inch, 2.2 * inch, 2.5 * inch, 1 * inch]
    )
    auth_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(auth_table)

    story.append(Paragraph("4.2 Listing Endpoints", subheading_style))
    listing_endpoints_data = [
        ["Method", "Endpoint", "Description", "Middleware"],
        ["GET", "/listings", "Display all listings", "None"],
        ["GET", "/listings/new", "New listing form", "isLoggedIn"],
        ["POST", "/listings", "Create new listing", "isLoggedIn, validateListing"],
        ["GET", "/listings/:id", "Show specific listing", "None"],
        ["GET", "/listings/:id/edit", "Edit listing form", "isLoggedIn, isOwner"],
        [
            "PUT",
            "/listings/:id",
            "Update listing",
            "isLoggedIn, isOwner, validateListing",
        ],
        ["DELETE", "/listings/:id", "Delete listing", "isLoggedIn, isOwner"],
    ]

    listing_table = Table(
        listing_endpoints_data, colWidths=[0.8 * inch, 2 * inch, 2.5 * inch, 1.2 * inch]
    )
    listing_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(listing_table)

    story.append(Paragraph("4.3 Review Endpoints", subheading_style))
    review_endpoints_data = [
        ["Method", "Endpoint", "Description", "Middleware"],
        [
            "POST",
            "/listings/:id/reviews",
            "Create review",
            "isLoggedIn, validateReview",
        ],
        [
            "DELETE",
            "/listings/:id/reviews/:reviewId",
            "Delete review",
            "isLoggedIn, isReviewAuthor",
        ],
    ]

    review_table = Table(
        review_endpoints_data, colWidths=[0.8 * inch, 2.5 * inch, 2.2 * inch, 1 * inch]
    )
    review_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(review_table)

    story.append(Paragraph("4.4 Static Page Endpoints", subheading_style))
    static_endpoints_data = [
        ["Method", "Endpoint", "Description"],
        ["GET", "/about", "About page"],
        ["GET", "/contact", "Contact page"],
        ["POST", "/contact", "Process contact form"],
        ["GET", "/faq", "FAQ page with interactive features"],
        ["GET", "/careers", "Careers page with job listings"],
        ["GET", "/blog", "Blog page with category filtering"],
        ["GET", "/help", "Help center with search functionality"],
        ["GET", "/host", "Host onboarding page"],
        ["POST", "/host/signup", "Process host signup"],
        ["GET", "/host/resources", "Host resources page"],
        ["GET", "/host/support", "Host support page"],
        ["GET", "/community", "Community hub page"],
        ["GET", "/events", "Events page"],
        ["GET", "/stories", "Guest stories page"],
        ["GET", "/tips", "Travel tips page"],
        ["GET", "/safety", "Safety information page"],
        ["GET", "/accessibility", "Accessibility features page"],
        ["POST", "/newsletter", "Newsletter subscription"],
        ["GET", "/privacy", "Privacy policy page"],
        ["GET", "/terms", "Terms of service page"],
    ]

    static_table = Table(
        static_endpoints_data, colWidths=[0.8 * inch, 2.5 * inch, 3.2 * inch]
    )
    static_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(static_table)
    story.append(PageBreak())

    # 5. Authentication System
    story.append(Paragraph("5. Authentication System", heading_style))

    story.append(Paragraph("5.1 Multi-Provider Authentication", subheading_style))
    auth_text = """
    HomyHive implements a comprehensive authentication system supporting multiple login methods:

    • Local Authentication: Username/password with Passport Local Strategy
    • Google OAuth 2.0: Seamless Google account integration
    • Facebook OAuth: Facebook account integration
    • Email Verification: OTP-based email verification system
    • Phone Verification: SMS-based phone number verification via Twilio
    """
    story.append(Paragraph(auth_text, normal_style))

    story.append(Paragraph("5.2 OAuth Configuration", subheading_style))
    oauth_code = """
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            let user = await User.findOne({ email: email });

            if (user) {
                if (!user.googleId) {
                    user.googleId = profile.id;
                    user.displayName = profile.displayName;
                    await user.save();
                }
                return done(null, user);
            } else {
                const newUser = new User({
                    email: email,
                    googleId: profile.id,
                    displayName: profile.displayName,
                    isEmailVerified: true
                });
                await newUser.save();
                return done(null, newUser);
            }
        } catch (error) {
            return done(error, null);
        }
    }));
    """
    story.append(Paragraph(oauth_code, code_style))

    story.append(Paragraph("5.3 Session Management", subheading_style))
    session_code = """
    const sessionOptions = {
        store: MongoStore.create({
            mongoUrl: dbUrl,
            crypto: {
                secret: process.env.SECRET,
            },
            touchAfter: 24 * 3600,
        }),
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        },
    };
    """
    story.append(Paragraph(session_code, code_style))

    story.append(Paragraph("5.4 Middleware Functions", subheading_style))
    middleware_code = """
    // Authentication middleware
    module.exports.isLoggedIn = (req, res, next) => {
        if (!req.isAuthenticated()) {
            req.session.redirectUrl = req.originalUrl;
            req.flash("error", "You must be logged in to access this page!");
            return res.redirect("/login");
        }
        next();
    };

    // Owner authorization middleware
    module.exports.isOwner = async (req, res, next) => {
        let { id } = req.params;
        let listing = await Listing.findById(id);
        if (!listing.owner.equals(res.locals.currUser._id)) {
            req.flash("error", "You are not the owner of this listing!");
            return res.redirect(`/listings/${id}`);
        }
        next();
    };
    """
    story.append(Paragraph(middleware_code, code_style))
    story.append(PageBreak())

    # 6. Frontend Components
    story.append(Paragraph("6. Frontend Components", heading_style))

    story.append(Paragraph("6.1 Template Engine & Layout", subheading_style))
    frontend_text = """
    HomyHive uses EJS (Embedded JavaScript) as the template engine with a component-based architecture:

    • Base Layout: Common HTML structure with responsive design
    • Reusable Components: Header, footer, flash messages, forms
    • Responsive Design: Mobile-first approach with Bootstrap integration
    • Interactive Elements: JavaScript-enhanced user experience
    """
    story.append(Paragraph(frontend_text, normal_style))

    story.append(Paragraph("6.2 Key Frontend Features", subheading_style))
    frontend_features_data = [
        ["Component", "Description", "Technologies"],
        [
            "Navigation Bar",
            "Responsive navigation with user status",
            "EJS, Bootstrap, JavaScript",
        ],
        ["Flash Messages", "User feedback system", "Connect-flash, Custom CSS"],
        [
            "Forms",
            "Input validation and submission",
            "HTML5, JavaScript, Joi validation",
        ],
        ["Image Upload", "Drag-and-drop file upload", "Multer, Cloudinary, JavaScript"],
        ["Maps Integration", "Interactive property location", "Mapbox GL JS"],
        ["Star Ratings", "Interactive rating system", "Custom CSS, JavaScript"],
        ["Search & Filter", "Property search functionality", "JavaScript, AJAX"],
        ["Modal Dialogs", "Enhanced user interactions", "JavaScript, CSS"],
        ["Responsive Design", "Mobile-optimized layouts", "CSS Media Queries, Flexbox"],
    ]

    frontend_table = Table(
        frontend_features_data, colWidths=[1.5 * inch, 3 * inch, 2 * inch]
    )
    frontend_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(frontend_table)

    story.append(Paragraph("6.3 CSS Architecture", subheading_style))
    css_code = """
    /* Custom CSS Variables for Consistent Theming */
    :root {
        --primary-color: #fe424d;
        --primary-hover: #d7263d;
        --secondary-color: #ff7e5f;
        --background-light: #f8f9fa;
        --text-dark: #333333;
        --text-light: #666666;
        --border-color: #dee2e6;
        --success-color: #28a745;
        --warning-color: #ffc107;
        --error-color: #dc3545;
    }

    /* Responsive Grid System */
    .listing-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        padding: 2rem;
    }

    /* Interactive Card Components */
    .listing-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        transition: transform 0.3s, box-shadow 0.3s;
        overflow: hidden;
    }

    .listing-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }
    """
    story.append(Paragraph(css_code, code_style))

    story.append(Paragraph("6.4 JavaScript Functionality", subheading_style))
    js_code = """
    // Interactive Map Integration
    function initializeMap(coordinates) {
        mapboxgl.accessToken = mapToken;
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: coordinates,
            zoom: 10
        });

        const marker = new mapboxgl.Marker({ color: '#fe424d' })
            .setLngLat(coordinates)
            .addTo(map);
    }

    // Form Validation
    function validateForm(formId) {
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll('input[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (!this.value.trim()) {
                    this.classList.add('error');
                } else {
                    this.classList.remove('error');
                }
            });
        });
    }
    """
    story.append(Paragraph(js_code, code_style))
    story.append(PageBreak())

    # 7. Features & Functionality
    story.append(Paragraph("7. Features & Functionality", heading_style))

    story.append(Paragraph("7.1 Core Platform Features", subheading_style))
    core_features_text = """
    HomyHive provides a comprehensive set of features for both guests and hosts:
    """
    story.append(Paragraph(core_features_text, normal_style))

    core_features_data = [
        ["Feature Category", "Guest Features", "Host Features"],
        [
            "Account Management",
            "• Multi-provider authentication\\n• Profile management\\n• Email/phone verification",
            "• Host onboarding process\\n• Property management\\n• Earnings tracking",
        ],
        [
            "Property Discovery",
            "• Advanced search & filters\\n• Map-based browsing\\n• Property details & photos",
            "• Property listing creation\\n• Photo upload & management\\n• Pricing & availability",
        ],
        [
            "Booking System",
            "• Instant booking\\n• Booking history\\n• Cancellation management",
            "• Booking requests\\n• Calendar management\\n• Guest communication",
        ],
        [
            "Communication",
            "• Host messaging\\n• Support chat\\n• Email notifications",
            "• Guest messaging\\n• Host support\\n• Notification preferences",
        ],
        [
            "Reviews & Ratings",
            "• Submit reviews\\n• View host ratings\\n• Property feedback",
            "• Respond to reviews\\n• Guest ratings\\n• Performance metrics",
        ],
        [
            "Support System",
            "• 24/7 help center\\n• FAQ system\\n• Contact forms",
            "• Host resources\\n• Community support\\n• Educational content",
        ],
    ]

    features_table = Table(
        core_features_data, colWidths=[1.5 * inch, 2.5 * inch, 2.5 * inch]
    )
    features_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(features_table)

    story.append(Paragraph("7.2 Advanced Functionality", subheading_style))

    story.append(Paragraph("Email System", subheading_style))
    email_text = """
    Comprehensive email system with department-based routing:
    • Guest Support: guest-support@homyhive.com
    • Host Support: host-support@homyhive.com
    • Payments: payments@homyhive.com
    • Emergency: emergency@homyhive.com
    • Partnerships: partnerships@homyhive.com
    • Press Inquiries: press@homyhive.com
    • Trust & Safety: trust-safety@homyhive.com
    """
    story.append(Paragraph(email_text, normal_style))

    story.append(Paragraph("Geolocation Services", subheading_style))
    geo_text = """
    Mapbox integration for location-based features:
    • Interactive property maps
    • Geocoding for address conversion
    • Distance-based search
    • Neighborhood information
    • 2D sphere indexing for efficient queries
    """
    story.append(Paragraph(geo_text, normal_style))

    story.append(Paragraph("7.3 Content Management", subheading_style))
    content_data = [
        ["Page Type", "Features", "Interactive Elements"],
        [
            "FAQ Page",
            "Categorized questions, search functionality",
            "Accordion UI, filtering, search",
        ],
        [
            "Blog Page",
            "Content categories, featured posts",
            "Category filtering, modal previews",
        ],
        [
            "Careers Page",
            "Job listings, application system",
            "Application forms, email integration",
        ],
        [
            "Help Center",
            "Comprehensive support articles",
            "Search, categorization, quick help",
        ],
        [
            "Host Resources",
            "Educational content, guides",
            "Resource downloads, tutorials",
        ],
        ["Contact Page", "Multi-department routing", "Smart forms, emergency contacts"],
    ]

    content_table = Table(content_data, colWidths=[1.5 * inch, 2.5 * inch, 2.5 * inch])
    content_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(content_table)
    story.append(PageBreak())

    # 8. Configuration & Environment
    story.append(Paragraph("8. Configuration & Environment", heading_style))

    story.append(Paragraph("8.1 Environment Variables", subheading_style))
    env_code = """
    # Database Configuration
    ATLASDB_URL=mongodb+srv://username:password@cluster.mongodb.net/homyhive

    # Session Security
    SECRET=your-super-secret-session-key

    # Cloudinary Configuration (Image Storage)
    CLOUD_NAME=your-cloudinary-cloud-name
    CLOUD_API_KEY=your-cloudinary-api-key
    CLOUD_API_SECRET=your-cloudinary-api-secret

    # Mapbox Configuration
    MAP_TOKEN=your-mapbox-access-token

    # OAuth Configuration
    GOOGLE_CLIENT_ID=your-google-oauth-client-id
    GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
    FACEBOOK_APP_ID=your-facebook-app-id
    FACEBOOK_APP_SECRET=your-facebook-app-secret

    # Email Configuration
    GMAIL_USER=your-gmail-username
    GMAIL_APP_PASSWORD=your-gmail-app-password

    # SMS Configuration (Twilio)
    TWILIO_ACCOUNT_SID=your-twilio-account-sid
    TWILIO_AUTH_TOKEN=your-twilio-auth-token
    TWILIO_PHONE_NUMBER=your-twilio-phone-number
    """
    story.append(Paragraph(env_code, code_style))

    story.append(Paragraph("8.2 Cloudinary Configuration", subheading_style))
    cloudinary_code = """
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_API_KEY,
        api_secret: process.env.CLOUD_API_SECRET
    });

    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'homyhive_listings',
            allowedFormats: ["png", "jpg", "jpeg"],
            transformation: [
                { width: 800, height: 600, crop: "fill" },
                { quality: "auto" },
                { fetch_format: "auto" }
            ]
        },
    });
    """
    story.append(Paragraph(cloudinary_code, code_style))

    story.append(Paragraph("8.3 Database Configuration", subheading_style))
    db_code = """
    const mongoose = require("mongoose");
    const dbUrl = process.env.ATLASDB_URL;

    async function main() {
        await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB Atlas");
    }

    // MongoDB Atlas Connection with Error Handling
    main().then(() => {
        console.log("Database connection established");
    }).catch((err) => {
        console.error("Database connection failed:", err);
    });
    """
    story.append(Paragraph(db_code, code_style))

    story.append(Paragraph("8.4 Security Configuration", subheading_style))
    security_data = [
        ["Security Feature", "Implementation", "Purpose"],
        [
            "Session Management",
            "express-session + MongoStore",
            "Secure user sessions with database persistence",
        ],
        [
            "Password Hashing",
            "passport-local-mongoose",
            "Automatic password hashing with salt",
        ],
        [
            "CSRF Protection",
            "Built-in Express protection",
            "Prevent cross-site request forgery",
        ],
        [
            "Input Validation",
            "Joi validation schemas",
            "Sanitize and validate all user inputs",
        ],
        [
            "File Upload Security",
            "Multer + Cloudinary",
            "Secure file handling with cloud storage",
        ],
        [
            "Environment Variables",
            "dotenv configuration",
            "Secure credential management",
        ],
        ["OAuth Security", "Passport strategies", "Secure third-party authentication"],
        ["Error Handling", "Custom error middleware", "Prevent information leakage"],
    ]

    security_table = Table(security_data, colWidths=[1.5 * inch, 2 * inch, 3 * inch])
    security_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(security_table)
    story.append(PageBreak())

    # 9. Deployment Guide
    story.append(Paragraph("9. Deployment Guide", heading_style))

    story.append(Paragraph("9.1 Production Setup", subheading_style))
    deployment_text = """
    HomyHive is designed for production deployment with the following considerations:
    """
    story.append(Paragraph(deployment_text, normal_style))

    deployment_steps = """
    1. Server Requirements:
       • Node.js 22.18.0 or higher
       • MongoDB Atlas cluster
       • SSL certificate for HTTPS
       • Domain name configuration

    2. Environment Setup:
       • Configure all environment variables
       • Set NODE_ENV=production
       • Enable MongoDB connection pooling
       • Configure reverse proxy (Nginx recommended)

    3. Security Hardening:
       • Enable HTTPS/SSL
       • Configure Content Security Policy
       • Set secure session cookies
       • Enable rate limiting
       • Configure CORS appropriately

    4. Performance Optimization:
       • Enable gzip compression
       • Configure caching headers
       • Optimize database queries
       • Enable CDN for static assets
       • Monitor application performance
    """
    story.append(Paragraph(deployment_steps, normal_style))

    story.append(Paragraph("9.2 Cloud Deployment Options", subheading_style))
    cloud_data = [
        ["Platform", "Pros", "Configuration Notes"],
        [
            "Heroku",
            "Easy deployment, automatic scaling",
            "Use Heroku Postgres addon, configure buildpacks",
        ],
        [
            "AWS EC2",
            "Full control, scalable",
            "Configure Load Balancer, Auto Scaling Groups",
        ],
        ["DigitalOcean", "Cost-effective, simple", "Use App Platform or Droplets"],
        [
            "Google Cloud",
            "GCP integration, reliable",
            "Use Cloud Run or Compute Engine",
        ],
        [
            "Vercel",
            "Easy Node.js deployment",
            "Configure environment variables, database",
        ],
        [
            "Railway",
            "Simple deployment process",
            "Connect GitHub repo, set environment",
        ],
    ]

    cloud_table = Table(cloud_data, colWidths=[1.5 * inch, 2.5 * inch, 2.5 * inch])
    cloud_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(cloud_table)

    story.append(Paragraph("9.3 Monitoring & Maintenance", subheading_style))
    monitoring_code = """
    // Application Health Check Endpoint
    app.get('/health', (req, res) => {
        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
        };
        res.status(200).json(health);
    });

    // Error Logging and Monitoring
    const winston = require('winston');
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [
            new winston.transports.File({ filename: 'error.log', level: 'error' }),
            new winston.transports.File({ filename: 'combined.log' })
        ],
    });
    """
    story.append(Paragraph(monitoring_code, code_style))
    story.append(PageBreak())

    # 10. Code Structure & Best Practices
    story.append(Paragraph("10. Code Structure & Best Practices", heading_style))

    story.append(Paragraph("10.1 Project Organization", subheading_style))
    organization_text = """
    HomyHive follows industry best practices for Node.js application structure:

    • Separation of Concerns: Clear separation between routes, controllers, models, and views
    • Modular Architecture: Each feature is organized in its own module
    • Configuration Management: Environment-based configuration
    • Error Handling: Centralized error handling with custom error classes
    • Validation: Input validation using Joi schemas
    • Security: Multiple layers of security implementation
    """
    story.append(Paragraph(organization_text, normal_style))

    story.append(Paragraph("10.2 Code Quality Standards", subheading_style))
    quality_data = [
        ["Aspect", "Implementation", "Benefits"],
        [
            "Code Organization",
            "MVC pattern with modular structure",
            "Maintainable and scalable codebase",
        ],
        [
            "Error Handling",
            "Try-catch blocks with custom error classes",
            "Robust error management and debugging",
        ],
        [
            "Input Validation",
            "Joi schemas for all user inputs",
            "Data integrity and security",
        ],
        [
            "Database Queries",
            "Mongoose ODM with population",
            "Type safety and relationship management",
        ],
        [
            "Async Handling",
            "Async/await with proper error catching",
            "Clean asynchronous code",
        ],
        [
            "Security Practices",
            "Multiple authentication strategies",
            "Comprehensive security coverage",
        ],
        [
            "Code Reusability",
            "Middleware functions and utilities",
            "DRY principle implementation",
        ],
        [
            "Documentation",
            "Inline comments and README files",
            "Easy onboarding and maintenance",
        ],
    ]

    quality_table = Table(quality_data, colWidths=[1.5 * inch, 2.5 * inch, 2.5 * inch])
    quality_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fe424d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    story.append(quality_table)

    story.append(Paragraph("10.3 Development Workflow", subheading_style))
    workflow_code = """
    // Development Commands
    npm install              # Install dependencies
    npm start               # Start production server
    node app.js             # Start development server

    // Environment Setup
    cp .env.example .env    # Copy environment template
    # Configure all required environment variables

    // Database Initialization
    cd init
    node index.js           # Seed database with sample data

    // Development Best Practices
    1. Always validate user inputs
    2. Use middleware for common functionality
    3. Implement proper error handling
    4. Test all routes and features
    5. Keep environment variables secure
    6. Use meaningful commit messages
    7. Document API endpoints
    8. Implement logging for debugging
    """
    story.append(Paragraph(workflow_code, code_style))

    story.append(Paragraph("10.4 Future Enhancements", subheading_style))
    future_text = """
    Potential areas for enhancement and expansion:

    • Real-time Messaging: WebSocket implementation for instant communication
    • Payment Integration: Stripe/PayPal integration for secure payments
    • Advanced Search: Elasticsearch for complex search queries
    • Mobile App: React Native or Flutter mobile application
    • Analytics Dashboard: Real-time analytics for hosts and admins
    • AI Features: Recommendation engine and price optimization
    • Multi-language Support: Internationalization (i18n) implementation
    • Progressive Web App: PWA features for offline functionality
    • Advanced Security: Two-factor authentication and advanced fraud detection
    • API Documentation: Swagger/OpenAPI documentation for external developers
    """
    story.append(Paragraph(future_text, normal_style))

    # Footer
    story.append(Spacer(1, 40))
    story.append(Paragraph("End of Documentation", styles["Heading2"]))
    story.append(Spacer(1, 20))
    story.append(
        Paragraph(
            "This documentation provides comprehensive information about the HomyHive project for RAG system implementation. For technical support or questions, contact the development team.",
            normal_style,
        )
    )

    # Build PDF
    doc.build(story)
    print("📄 HomyHive project documentation PDF generated successfully!")
    print("📁 File saved as: HomyHive_Project_Documentation.pdf")

    story.append(Spacer(1, 40))
    story.append(Paragraph("End of Documentation", styles["Heading2"]))
    story.append(Paragraph("End of Documentation", styles["Heading2"]))
    story.append(Spacer(1, 20))
    story.append(
        Paragraph(
            "This documentation provides comprehensive information about the HomyHive project for RAG system implementation. For technical support or questions, contact the development team.",
            normal_style,
        )
    )

    # Build PDF
    doc.build(story)
    print("📄 HomyHive project documentation PDF generated successfully!")
    print("📁 File saved as: HomyHive_Project_Documentation.pdf")


if __name__ == "__main__":
    create_homyhive_documentation()

const express = require("express");
const router = express.Router();
const sendMail = require("../utils/sendMail");
const hostController = require("../controllers/hosts");
const { isLoggedIn } = require("../middleware");
const expressAsyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Resource pages mapping (slug -> page data)
const resourcePages = {
  "host-onboarding-guide": {
    title: "Host Onboarding Guide",
    subtitle:
      "Step-by-step onboarding checklist and practical tips to get your space ready for guests.",
    sections: [
      {
        heading: "Overview",
        content:
          "<p>This guide walks you through the essentials to become a successful host: account setup, identity verification, listing creation and first guest readiness.</p>",
      },
      {
        heading: "Before You Start",
        content:
          "<ul><li>Create and verify your account (email & phone).</li><li>Prepare identity documents and address proof.</li><li>Choose a clear display name and add a profile photo.</li></ul>",
      },
      {
        heading: "Listing Creation Checklist",
        content:
          "<ol><li>Write a short, honest title.</li><li>Upload 8–12 high-quality photos showing every room.</li><li>Complete amenities, house rules and pricing.</li><li>Set an accurate cancellation policy and check-in instructions.</li></ol>",
      },
      {
        heading: "Tips for Quick Approval",
        content:
          "<p>Respond quickly to verification emails, double-check bank/payout details, and ensure uploaded documents are legible photos or scanned copies.</p>",
      },
    ],
  },
  "creating-your-first-listing": {
    title: "Creating Your First Listing",
    subtitle:
      "How to write great titles, descriptions and choose amenities that attract guests.",
    sections: [
      {
        heading: "Crafting Your Title",
        content:
          '<p>Keep it short and descriptive: include property type and standout feature (e.g., "Cozy 1BHK Near Metro"). Avoid clickbait and be accurate.</p>',
      },
      {
        heading: "Writing The Description",
        content:
          "<p>Start with a 1–2 sentence summary of what makes your place special. Then include practical details: sleeping arrangements, nearest transport, and any unique rules.</p>",
      },
      {
        heading: "Amenities & House Rules",
        content:
          "<ul><li>List essentials (Wi‑Fi, hot water, AC).</li><li>Be explicit about guest access, pets, smoking, and parties.</li></ul>",
      },
      {
        heading: "Photos That Convert",
        content:
          "<p>Use natural light, show each room from multiple angles, and include hero shots of the living room and bedroom. Consider a tidy, styled shot of the entrance and a neighbourhood image.</p>",
      },
    ],
  },
  "photo-guidelines": {
    title: "Photo Guidelines",
    subtitle:
      "Simple photography tips to make your listing look professional and inviting.",
    sections: [
      {
        heading: "Lighting & Composition",
        content:
          "<p>Shoot during daytime using natural light. Use a tripod for stability and take photos from chest height for natural perspective.</p>",
      },
      {
        heading: "Essential Shots",
        content:
          "<ul><li>Hero shot: the best photo for search listing.</li><li>Bedroom, living area, kitchen, bathroom, and exterior.</li><li>Unique features (view, balcony, workspace).</li></ul>",
      },
      {
        heading: "Staging & Editing",
        content:
          "<p>Declutter, make the bed, add a small plant or fresh towels. Apply light color-correction; avoid heavy filters that misrepresent the space.</p>",
      },
    ],
  },
  "pricing-your-space": {
    title: "Pricing Your Space",
    subtitle:
      "Practical guidance to set competitive prices and increase occupancy.",
    sections: [
      {
        heading: "Research Comparable Listings",
        content:
          "<p>Compare similar size and location listings to establish a baseline. Consider amenities, proximity to transport, and peak demand days.</p>",
      },
      {
        heading: "Set Smart Minimums",
        content:
          "<p>Use minimum night stays around high-demand dates and shorter stays during off-season to keep bookings consistent.</p>",
      },
      {
        heading: "Discounts & Promotions",
        content:
          "<p>Offer a small introductory discount or weekly pricing to drive early bookings and more reviews.</p>",
      },
    ],
  },
  "host-legal-requirements": {
    title: "Host Legal Requirements",
    subtitle:
      "Overview of common legal and compliance considerations for short‑term rentals.",
    sections: [
      {
        heading: "Local Registration & Permits",
        content:
          "<p>Many cities require registration or specific permits for short-term rentals. Check your municipal website or local government portal for application steps.</p>",
      },
      {
        heading: "Safety Standards",
        content:
          "<p>Ensure smoke detectors, fire extinguishers and clear evacuation information are present. Keep records of regular maintenance and inspections.</p>",
      },
    ],
  },
  "tax-guidelines-for-hosts": {
    title: "Tax Guidelines for Hosts",
    subtitle:
      "How to track income and understand common tax treatments for hosting activity.",
    sections: [
      {
        heading: "Recordkeeping",
        content:
          "<p>Keep clear records of all bookings, payouts, cleaning and maintenance invoices. Use spreadsheets or an accounting app to separate business and personal expenses.</p>",
      },
      {
        heading: "Common Deductions",
        content:
          "<p>Typical deductible items include cleaning, repairs, utilities for the rental area, and a portion of home insurance. Consult a tax advisor for exact rules.</p>",
      },
    ],
  },
  "local-regulations-by-state": {
    title: "Local Regulations by State",
    subtitle:
      "How to find authoritative local rules and what to check for in your city or state.",
    sections: [
      {
        heading: "Where to Look",
        content:
          '<p>Start with your state government and city/municipal websites. Search for "short-term rental" or "vacation rental" regulations.</p>',
      },
      {
        heading: "Key Questions",
        content:
          "<ul><li>Are short-term rentals allowed in your zone?</li><li>Are there registration, safety or tax requirements?</li><li>Are there specific occupancy limits or parking rules?</li></ul>",
      },
    ],
  },
  "insurance-information": {
    title: "Insurance Information",
    subtitle:
      "Insurance options and steps to protect yourself and your property while hosting.",
    sections: [
      {
        heading: "Policy Types",
        content:
          "<p>Review homeowner insurance limitations for short-term rentals and consider a specialized short-term rental policy or landlord insurance for added protection.</p>",
      },
      {
        heading: "What to Share with Insurer",
        content:
          "<p>Be open with insurers about hosting activity—non-disclosure can lead to denied claims. Keep records of guest incidents and damage reports.</p>",
      },
    ],
  },
  "listing-optimization-guide": {
    title: "Listing Optimization Guide",
    subtitle: "Tactics to increase listing visibility and boost conversions.",
    sections: [
      {
        heading: "Title & Keywords",
        content:
          '<p>Include neighborhood names and key amenities (e.g., "Near Airport", "Free Parking"). Avoid stuffing—keep the title readable.</p>',
      },
      {
        heading: "Complete All Fields",
        content:
          "<p>Fill in every listing field: amenities, rules, check-in details and accurate property type—platform algorithms favor complete listings.</p>",
      },
    ],
  },
  "seasonal-pricing-strategies": {
    title: "Seasonal Pricing Strategies",
    subtitle:
      "How to use seasonal demand and local events to optimize revenue.",
    sections: [
      {
        heading: "Use Local Events",
        content:
          "<p>Research local event calendars (festivals, conferences) and increase prices or set minimum stays during high-demand windows.</p>",
      },
      {
        heading: "Promotions & Offseason",
        content:
          "<p>Offer discounts, extended-stay rates or free cleaning in low season to maintain occupancy.</p>",
      },
    ],
  },
  "guest-communication-tips": {
    title: "Guest Communication Tips",
    subtitle:
      "Templates and best practices to communicate clearly with guests for better reviews.",
    sections: [
      {
        heading: "Pre-Arrival Messages",
        content:
          "<p>Send a friendly pre-arrival message 24–48 hours before check-in with directions, check-in code and pickup suggestions.</p>",
      },
      {
        heading: "During Stay",
        content:
          "<p>Provide a short welcome message and a quick way to reach you. Respond within an hour when possible—fast replies improve guest satisfaction.</p>",
      },
    ],
  },
  "building-your-host-reputation": {
    title: "Building Your Host Reputation",
    subtitle: "Practical steps to earn five‑star reviews and repeat guests.",
    sections: [
      {
        heading: "Deliver What You Promise",
        content:
          "<p>Ensure your listing matches reality—accurate photos, clear rules, and reliable check-in. Surprise guests with small touches (snacks, local tips).</p>",
      },
      {
        heading: "Ask for Feedback",
        content:
          "<p>Politely request feedback after checkout and learn from reviews to improve your listing and guest experience.</p>",
      },
    ],
  },
  "property-safety-checklist": {
    title: "Property Safety Checklist",
    subtitle:
      "Essential checks and items to keep your property safe for guests.",
    sections: [
      {
        heading: "Essentials",
        content:
          "Smoke detectors, first-aid kit, emergency contact numbers, and clear evacuation routes.",
      },
    ],
  },
  "guest-screening-guidelines": {
    title: "Guest Screening Guidelines",
    subtitle:
      "Tips to verify guest suitability while respecting privacy and anti-discrimination rules.",
    sections: [
      {
        heading: "Best Practices",
        content:
          "Use verified IDs where available and ask clarifying questions for large groups.",
      },
    ],
  },
  "emergency-procedures": {
    title: "Emergency Procedures",
    subtitle:
      "Step-by-step guidance for common emergencies and guest incidents.",
    sections: [
      {
        heading: "Immediate Steps",
        content:
          "Prioritize safety, call emergency services if needed, and notify platform support.",
      },
    ],
  },
  "security-device-recommendations": {
    title: "Security Device Recommendations",
    subtitle:
      "Recommended devices and placement for guest and property security.",
    sections: [
      {
        heading: "Recommended Devices",
        content:
          "Smart locks, cameras in public areas (disclosed), motion sensors, and doorbell cameras.",
      },
    ],
  },
  "income-tracking-tools": {
    title: "Income Tracking Tools",
    subtitle:
      "Tools and spreadsheets to keep track of hosting income and performance.",
    sections: [
      {
        heading: "Tools",
        content:
          "Consider simple spreadsheets, accounting apps, or bookkeeping services for hosts.",
      },
    ],
  },
  "expense-management": {
    title: "Expense Management",
    subtitle:
      "How to categorize and track deductible expenses for your hosting business.",
    sections: [
      {
        heading: "Categories",
        content:
          "Cleaning, maintenance, utilities, supplies, and service fees.",
      },
    ],
  },
  "gst-compliance-for-hosts": {
    title: "GST Compliance for Hosts",
    subtitle:
      "High-level guidance on GST registration thresholds and invoicing basics.",
    sections: [
      {
        heading: "Thresholds",
        content:
          "If your annual turnover exceeds the local threshold, you may need to register for GST. Consult a tax advisor.",
      },
    ],
  },
  "payout-information": {
    title: "Payout Information",
    subtitle:
      "How payouts are processed and tips for ensuring timely payments.",
    sections: [
      {
        heading: "Bank Details",
        content:
          "Keep your payout bank details up to date and verify small deposits if required.",
      },
    ],
  },
  "recommended-host-apps": {
    title: "Recommended Host Apps",
    subtitle:
      "Apps for calendar syncing, cleaning management, messaging, and price optimization.",
    sections: [
      {
        heading: "Categories",
        content:
          "Channel managers, messaging automations, cleaning schedulers and pricing tools.",
      },
    ],
  },
  "smart-home-integration": {
    title: "Smart Home Integration",
    subtitle:
      "Using smart locks, thermostats and automation to simplify hosting.",
    sections: [
      {
        heading: "Privacy",
        content:
          "Always disclose cameras and data-collection; use sensors responsibly.",
      },
    ],
  },
  "calendar-management": {
    title: "Calendar Management",
    subtitle:
      "Avoid double-bookings by syncing calendars and setting clear minimum nights.",
    sections: [
      {
        heading: "Syncing",
        content:
          "Use iCal or channel manager integrations to sync across platforms.",
      },
    ],
  },
  "automation-tools": {
    title: "Automation Tools",
    subtitle: "Automate messaging, check-ins and price changes to save time.",
    sections: [
      {
        heading: "What to Automate",
        content:
          "Pre-arrival messages, review reminders, and check-out instructions.",
      },
    ],
  },
  "booking-help": {
    title: "Booking Help",
    subtitle:
      "How to manage bookings, modify reservations, and handle cancellations.",
    sections: [
      {
        heading: "Making a Reservation",
        content:
          "<p>Guests can book directly through the platform. Keep your calendar current and verify minimum night settings to avoid conflicts.</p>",
      },
      {
        heading: "Modifying Reservations",
        content:
          "<p>If a guest requests date changes, confirm availability before accepting and update the reservation via the host dashboard.</p>",
      },
      {
        heading: "Cancellations & Refunds",
        content:
          "<p>Follow your cancellation policy for refunds. For emergency cancellations, contact host support immediately for guidance.</p>",
      },
    ],
  },
  "safety-and-trust": {
    title: "Safety & Trust",
    subtitle:
      "Guidelines to protect guests and hosts, plus reporting procedures for incidents.",
    sections: [
      {
        heading: "Property Safety Checklist",
        content:
          "<p>Ensure working smoke detectors, clear escape routes, and a stocked first-aid kit. Keep documentation of maintenance.</p>",
      },
      {
        heading: "Guest Screening",
        content:
          "<p>Use verification tools, communicate expectations clearly, and avoid discriminatory practices when screening guests.</p>",
      },
      {
        heading: "Reporting Incidents",
        content:
          "<p>Report safety incidents promptly to host support and local authorities when necessary. Keep photos and written records for any claims.</p>",
      },
    ],
  },
};

// Generic resource route: renders content for the slug if available
router.get(
  "/resources/:slug",
  expressAsyncHandler((req, res) => {
    // Normalize incoming slug (case-insensitive, spaces -> hyphens)
    const raw = String(req.params.slug || "").trim();
    const slug = raw.toLowerCase();

    // Try multiple keys to be forgiving with slugs
    const candidates = [
      slug,
      slug.replace(/\s+/g, "-"),
      decodeURIComponent(slug),
      decodeURIComponent(slug).replace(/\s+/g, "-"),
    ];

    let page;
    for (const c of candidates) {
      if (resourcePages[c]) {
        page = resourcePages[c];
        break;
      }
    }

    // If not found, render a lightweight generic resource page (avoid 404 flash)
    if (!page) {
      const niceTitle = raw
        ? raw.replace(/[-_]/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())
        : "Resource";
      page = {
        title: niceTitle,
        subtitle:
          "Content coming soon. Check back shortly for detailed guidance.",
        sections: [
          {
            heading: "Overview",
            content:
              "We are preparing useful guidance for this topic. Meanwhile, explore other resources from the Host Resources page.",
          },
        ],
      };
    }

    res.render("static/resource", page);
  }),
);

// Render static pages
router.get("/terms", (req, res) => res.render("static/terms"));
router.get("/privacy", (req, res) => res.render("static/privacy"));
router.get("/about", (req, res) => res.render("static/about"));
router.get("/faq", (req, res) => res.render("static/faq"));
router.get("/careers", (req, res) => res.render("static/careers"));
router.get("/blog", (req, res) => res.render("static/blog"));
router.get("/help", (req, res) => res.render("static/help"));
router.get("/contact", (req, res) => res.render("static/contact"));

// Host Feature Pages - Separate and Distinct
router.get(
  "/host",
  isLoggedIn,
  expressAsyncHandler(hostController.renderHostOnboarding),
);
router.get(
  "/host-details",
  isLoggedIn,
  expressAsyncHandler(hostController.renderHostOnboarding),
);
router.get(
  "/property-details",
  isLoggedIn,
  expressAsyncHandler(hostController.renderHostOnboarding),
);
router.get(
  "/host-verify",
  isLoggedIn,
  expressAsyncHandler(hostController.renderHostOnboarding),
);
router.get("/host-resources", (req, res) =>
  res.render("static/host-resources"),
); // Host Resources & Guides
router.get("/host-support", (req, res) => res.render("static/host-support")); // Host Support & Help

// Legacy routes for backward compatibility
router.get("/host/resources", (req, res) => res.redirect("/host-resources"));
router.get("/host/support", (req, res) => res.redirect("/host-support"));
router.get("/community", (req, res) => res.render("static/community"));
router.get("/events", (req, res) => res.render("static/events"));
router.get("/stories", (req, res) => res.render("static/stories"));
router.get("/tips", (req, res) => res.render("static/tips"));
router.get("/safety", (req, res) => res.render("static/safety"));
router.get("/accessibility", (req, res) => res.render("static/accessibility"));

// Handle contact form submissions
router.post("/contact", async (req, res) => {
  const { name, email, phone, category, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    req.flash("error", "Please fill in all required fields.");
    return res.redirect("/contact");
  }

  try {
    // Determine the appropriate department based on category
    const departmentMap = {
      general: "guest-support@homyhive.com",
      booking: "guest-support@homyhive.com",
      payment: "payments@homyhive.com",
      hosting: "host-support@homyhive.com",
      partnership: "partnerships@homyhive.com",
      press: "press@homyhive.com",
      safety: "trust-safety@homyhive.com",
      emergency: "emergency@homyhive.com",
    };

    const departmentEmail =
      departmentMap[category] || "guest-support@homyhive.com";

    const contactMessage = `
			Contact Form Submission - HomyHive

			=== CONTACT DETAILS ===
			Name: ${name}
			Email: ${email}
			Phone: ${phone || "Not provided"}

			=== INQUIRY DETAILS ===
			Department: ${departmentEmail}
			Category: ${category}
			Subject: ${subject}

			=== MESSAGE ===
			${message}

			=== SYSTEM INFO ===
			Submitted: ${new Date().toLocaleString()}
			User IP: ${req.ip || "Unknown"}
		`;

    await sendMail(
      name,
      email,
      contactMessage,
      `[${category.toUpperCase()}] ${subject}`,
      departmentEmail,
    );
    req.flash(
      "success",
      "Thank you for contacting us! We will get back to you within 24 hours.",
    );
    res.redirect("/contact");
  } catch (err) {
    console.error("Contact form error:", err);

    // Provide detailed error information for debugging
    if (err.code === "EAUTH") {
      console.error(
        "Gmail authentication failed. Please check GMAIL_APP_PASSWORD in .env file",
      );
      req.flash(
        "error",
        "Email service is temporarily unavailable. Please contact us directly at murudanagashree17@gmail.com",
      );
    } else if (err.code === "ENOTFOUND") {
      console.error("Network error. Please check internet connection");
      req.flash(
        "error",
        "Network error. Please try again or contact us directly.",
      );
    } else {
      req.flash(
        "error",
        "Failed to send message. Please try again or contact us directly at murudanagashree17@gmail.com",
      );
    }

    res.redirect("/contact");
  }
});

// Handle privacy contact form
router.post("/privacy-contact", async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await sendMail(name, email, message);
    res.render("static/privacy", { success: "Your message has been sent!" });
  } catch (err) {
    res.render("static/privacy", {
      error: "Failed to send message. Please try again.",
    });
  }
});

router.get("/image-test", (req, res) => res.render("image-test"));
router.get("/test-image", (req, res) => res.render("test-image"));

module.exports = router;

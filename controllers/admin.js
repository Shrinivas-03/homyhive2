// controllers/admin.js
// ✅ Complete admin controller with property approval

const Host = require("../models/host");
const Listing = require("../models/listing");

// -------------------------------
// Display all host registration requests
// -------------------------------
module.exports.viewHostRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status || "all";
    const limit = 10;

    let query = {};
    if (status !== "all") {
      query.applicationStatus = status;
    }

    const totalRequests = await Host.countDocuments(query);
    const requestsData = await Host.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const requests = requestsData.map((requestData) => new Host(requestData));
    const totalPages = Math.ceil(totalRequests / limit);

    res.render("admin/host-requests", {
      requests,
      currentPage: page,
      totalPages,
      status,
      totalRequests,
    });
  } catch (error) {
    console.error("Error fetching host requests:", error);
    req.flash("error", "Failed to fetch host requests");
    res.redirect("/");
  }
};

// -------------------------------
// View individual host application
// -------------------------------
module.exports.viewHostDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const hostData = await Host.findById(id).lean();

    if (!hostData) {
      req.flash("error", "Host application not found");
      return res.redirect("/admin/host-requests");
    }

    const host = new Host(hostData);

    // ✅ Find associated listing
    const listing = await Listing.findOne({ host: id });

    res.render("admin/host-detail", { host, listing });
  } catch (error) {
    console.error("Error fetching host details:", error);
    req.flash("error", "Failed to fetch host details");
    res.redirect("/admin/host-requests");
  }
};

// -------------------------------
// Update host application status
// ✅ CRITICAL: Enable property viewing when approved
// -------------------------------
module.exports.updateHostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const host = await Host.findById(id);

    if (!host) {
      req.flash("error", "Host not found");
      return res.redirect("/admin/host-requests");
    }

    host.applicationStatus = status;

    // ✅ CRITICAL: Enable property creation when approved
    if (status === "approved") {
      host.approvedAt = new Date();
      host.canCreateProperty = true; // ✅ Allow host to create more properties
      console.log("✅ Host approved - canCreateProperty set to true");
    }

    if (status === "rejected") {
      host.rejectedAt = new Date();
      host.canCreateProperty = false;
    }

    if (adminNote) {
      host.addAdminNote(adminNote, req.session?.supabaseUser?.id || "admin");
    }

    await host.save();

    req.flash("success", `Host application ${status} successfully`);
    res.redirect(`/admin/host-requests/${id}`);
  } catch (error) {
    console.error("Error updating host status:", error);
    req.flash("error", "Failed to update host status");
    res.redirect(`/admin/host-requests/${req.params.id}`);
  }
};

// -------------------------------
// Approve property and make it live
// ✅ Creates listing if not exists
// -------------------------------
module.exports.approveProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const host = await Host.findById(id);

    if (!host) {
      req.flash("error", "Host not found");
      return res.redirect("/admin/pending-approvals");
    }

    // Check if listing already exists
    let listing = await Listing.findOne({ host: host._id });

    if (!listing) {
      // Create listing from host property details if it doesn't exist
      listing = new Listing({
        title: host.propertyDetails?.title || "Property",
        description: host.personalInfo?.bio || "",
        propertyType: host.propertyDetails?.propertyType || "apartment",
        guests: host.propertyDetails?.guests || 1,
        price: host.propertyDetails?.price || 0,
        cancellation: host.propertyDetails?.cancellation || "flexible",
        category: host.propertyDetails?.category || "rooms",
        country: host.address?.state || "India",
        location: `${host.address?.city}, ${host.address?.state}`,
        ownerEmail: host.personalInfo.email,
        host: host._id,
        images: host.documents?.propertyImages || [],
        geometry: {
          type: "Point",
          coordinates: [77.5946, 12.9716], // Default coordinates
        },
        amenities: host.propertyDetails?.amenities || [],
      });

      await listing.save();
      console.log("✅ Listing created during approval:", listing._id);
    }

    host.applicationStatus = "approved";
    host.canCreateProperty = true;
    host.approvedAt = new Date();
    await host.save();

    // Send email notification (if sendMail is configured)
    try {
      const sendMail = require("../utils/sendMail");
      const subject = "Your Property has been Approved!";
      const message = `
Dear ${host.personalInfo.firstName},

Congratulations! Your property "${listing.title}" has been approved and is now live on HomyHive.

You can now start receiving bookings!

Thank you for being a part of the HomyHive community!`;

      await sendMail(
        host.personalInfo.firstName,
        host.personalInfo.email,
        message,
        subject,
      );
    } catch (emailError) {
      console.log("Email notification failed:", emailError.message);
    }

    req.flash("success", "Property approved successfully");
    res.redirect("/admin/pending-approvals");
  } catch (error) {
    console.error("Error approving property:", error);
    req.flash("error", "Failed to approve property");
    res.redirect("/admin/pending-approvals");
  }
};

// -------------------------------
// Reject property
// -------------------------------
module.exports.rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const host = await Host.findById(id);

    if (!host) {
      req.flash("error", "Host not found");
      return res.redirect("/admin/pending-approvals");
    }

    host.applicationStatus = "rejected";
    host.rejectedAt = new Date();
    await host.save();

    // Send email notification (if configured)
    try {
      const sendMail = require("../utils/sendMail");
      const subject = "Your Property has been Rejected";
      const message = `
Dear ${host.personalInfo.firstName},

We regret to inform you that your property submission has been rejected.

If you have any questions, please contact our support team.

Thank you for your interest in HomyHive.`;

      await sendMail(
        host.personalInfo.firstName,
        host.personalInfo.email,
        message,
        subject,
      );
    } catch (emailError) {
      console.log("Email notification failed:", emailError.message);
    }

    req.flash("success", "Property rejected successfully");
    res.redirect("/admin/pending-approvals");
  } catch (error) {
    console.error("Error rejecting property:", error);
    req.flash("error", "Failed to reject property");
    res.redirect("/admin/pending-approvals");
  }
};

// -------------------------------
// Approve host application
// -------------------------------
module.exports.approveHost = async (req, res) => {
  try {
    const { id } = req.params;
    const host = await Host.findById(id);

    if (!host) {
      req.flash("error", "Host not found");
      return res.redirect("/admin/host-requests");
    }

    host.applicationStatus = "approved";
    host.approvedAt = new Date();
    host.canCreateProperty = true; // ✅ Enable property creation
    await host.save();

    // Send email notification
    try {
      const sendMail = require("../utils/sendMail");
      const subject = "Your HomyHive Host Application has been Approved!";
      const message = `
Dear ${host.personalInfo.firstName},

Congratulations! Your host application for HomyHive has been approved.

You can now create listings and start hosting guests.

Thank you for joining the HomyHive community!`;

      await sendMail(
        host.personalInfo.firstName,
        host.personalInfo.email,
        message,
        subject,
      );
    } catch (emailError) {
      console.log("Email notification failed:", emailError.message);
    }

    req.flash("success", "Host application approved successfully");
    res.redirect(req.headers.referer || "/admin/host-requests");
  } catch (error) {
    console.error("Error approving host:", error);
    req.flash("error", "Failed to approve host");
    res.redirect(req.headers.referer || "/admin/host-requests");
  }
};

// -------------------------------
// Reject host application
// -------------------------------
module.exports.rejectHost = async (req, res) => {
  try {
    const { id } = req.params;
    const host = await Host.findById(id);

    if (!host) {
      req.flash("error", "Host not found");
      return res.redirect("/admin/host-requests");
    }

    host.applicationStatus = "rejected";
    host.rejectedAt = new Date();
    host.canCreateProperty = false;
    await host.save();

    req.flash("success", "Host application rejected successfully");
    res.redirect(req.headers.referer || "/admin/host-requests");
  } catch (error) {
    console.error("Error rejecting host:", error);
    req.flash("error", "Failed to reject host");
    res.redirect(req.headers.referer || "/admin/host-requests");
  }
};

// -------------------------------
// Enable property creation for host
// -------------------------------
module.exports.enablePropertyCreation = async (req, res) => {
  try {
    const { id } = req.params;
    const host = await Host.findById(id);

    if (!host) {
      req.flash("error", "Host not found");
      return res.redirect("/admin/host-requests");
    }

    host.canCreateProperty = true;
    await host.save();

    req.flash("success", "Host can now create properties");
    res.redirect(req.headers.referer || "/admin/host-requests");
  } catch (error) {
    console.error("Error enabling property creation:", error);
    req.flash("error", "Failed to enable property creation");
    res.redirect(req.headers.referer || "/admin/host-requests");
  }
};

// -------------------------------
// Admin dashboard stats
// -------------------------------
module.exports.adminDashboard = async (req, res) => {
  try {
    const totalRequests = await Host.countDocuments();
    const submitted = await Host.countDocuments({
      applicationStatus: "submitted",
    });
    const underReview = await Host.countDocuments({
      applicationStatus: "under_review",
    });
    const approved = await Host.countDocuments({
      applicationStatus: "approved",
    });
    const rejected = await Host.countDocuments({
      applicationStatus: "rejected",
    });

    const recentRequests = await Host.find().sort({ createdAt: -1 }).limit(5);

    res.render("admin/dashboard", {
      stats: {
        total: totalRequests,
        submitted,
        underReview,
        approved,
        rejected,
      },
      recentRequests,
    });
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    res.redirect("/");
  }
};

// -------------------------------
// View pending approvals
// -------------------------------
module.exports.viewPendingApprovals = async (req, res) => {
  try {
    const hosts = await Host.find({
      applicationStatus: "pending-approval",
    }).sort({ createdAt: -1 });

    res.render("admin/pending-approvals", { hosts });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    req.flash("error", "Failed to fetch pending approvals");
    res.redirect("/admin/dashboard");
  }
};

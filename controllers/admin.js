const Host = require('../models/host');

// -------------------------------
// Display all host registration requests
// -------------------------------
module.exports.viewHostRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status || 'all';
    const limit = 10;

    let query = {};
    if (status !== 'all') {
      query.applicationStatus = status;
    }

    const totalRequests = await Host.countDocuments(query);

    const requests = await Host.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalPages = Math.ceil(totalRequests / limit);

    res.render('admin/host-requests', {
      requests,
      currentPage: page,
      totalPages,
      status,
      totalRequests
    });
  } catch (error) {
    console.error('Error fetching host requests:', error);
    req.flash('error', 'Failed to fetch host requests');
    res.redirect('/');
  }
};

// -------------------------------
// View individual host application
// -------------------------------
module.exports.viewHostDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const host = await Host.findById(id);
    if (!host) {
      req.flash('error', 'Host application not found');
      return res.redirect('/admin/host-requests');
    }

    res.render('admin/host-detail', { host });
  } catch (error) {
    console.error('Error fetching host details:', error);
    req.flash('error', 'Failed to fetch host details');
    res.redirect('/admin/host-requests');
  }
};

// -------------------------------
// Update host application status
// -------------------------------
module.exports.updateHostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const host = await Host.findById(id);
    if (!host) {
      req.flash('error', 'Host not found');
      return res.redirect('/admin/host-requests');
    }

    host.applicationStatus = status;

    if (status === 'approved') {
      host.approvedAt = new Date();
    }

    if (status === 'rejected') {
      host.rejectedAt = new Date();
    }

    if (adminNote) {
      host.addAdminNote(adminNote, req.session?.supabaseUser?.id || 'admin');
    }

    await host.save();

    req.flash('success', `Host application ${status} successfully`);
    res.redirect(`/admin/host-requests/${id}`);
  } catch (error) {
    console.error('Error updating host status:', error);
    req.flash('error', 'Failed to update host status');
    res.redirect(`/admin/host-requests/${req.params.id}`);
  }
};

// -------------------------------
// Admin dashboard stats
// -------------------------------
module.exports.adminDashboard = async (req, res) => {
  try {
    const totalRequests = await Host.countDocuments();
    const submitted = await Host.countDocuments({ applicationStatus: 'submitted' });
    const underReview = await Host.countDocuments({ applicationStatus: 'under_review' });
    const approved = await Host.countDocuments({ applicationStatus: 'approved' });
    const rejected = await Host.countDocuments({ applicationStatus: 'rejected' });

    const recentRequests = await Host.find()
      .sort({ submittedAt: -1 })
      .limit(5);

    res.render('admin/dashboard', {
      stats: {
        total: totalRequests,
        submitted,
        underReview,
        approved,
        rejected
      },
      recentRequests
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};

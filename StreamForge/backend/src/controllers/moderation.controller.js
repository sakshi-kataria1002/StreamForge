const Report = require('../models/Report.model');

// POST /api/v1/moderation/reports
exports.submitReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'targetType, targetId, and reason are required' },
      });
    }

    const existing = await Report.findOne({
      reportedBy: req.user.id,
      targetType,
      targetId,
      status: 'pending',
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_REPORTED', message: 'You have already reported this content' },
      });
    }

    const report = await Report.create({
      reportedBy: req.user.id,
      targetType,
      targetId,
      reason,
      description: description || '',
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// GET /api/v1/moderation/reports?status=pending&page=1&limit=20
exports.getReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.targetType) filter.targetType = req.query.targetType;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reportedBy', 'name email')
        .populate('reviewedBy', 'name'),
      Report.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { reports, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

// PATCH /api/v1/moderation/reports/:reportId
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['pending', 'reviewed', 'dismissed', 'actioned'];

    if (!status || !VALID.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `status must be one of: ${VALID.join(', ')}` },
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      { status, reviewedBy: req.user.id },
      { new: true, runValidators: true }
    )
      .populate('reportedBy', 'name email')
      .populate('reviewedBy', 'name');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
      });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

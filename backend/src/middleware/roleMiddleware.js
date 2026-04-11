exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

exports.requireVerifiedNGO = (req, res, next) => {
  if (req.user.role !== 'NGO') {
    return res.status(403).json({ success: false, message: 'Only NGOs can perform this action.' });
  }
  const status = req.user.ngoVerification?.status;
  if (!['EMAIL_VERIFIED', 'VERIFIED'].includes(status)) {
    return res.status(403).json({
      success: false,
      message: 'Your NGO is not yet verified. Please complete the verification process.',
    });
  }
  next();
};
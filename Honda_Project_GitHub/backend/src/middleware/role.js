export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires ${roles.join(' or ')} privilege. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');

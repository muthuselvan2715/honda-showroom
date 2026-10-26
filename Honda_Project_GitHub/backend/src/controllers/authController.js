import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { logAudit } from '../services/auditService.js';

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_dealership_2026_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn }
  );
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await logAudit({
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id,
      user,
      details: `User ${user.email} (${user.role}) logged in successfully`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const registerStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'staff',
      phone: phone || '',
    });

    await logAudit({
      action: 'USER_CREATED',
      entity: 'User',
      entityId: newUser._id,
      user: req.user,
      details: `Created new ${newUser.role} user: ${newUser.email}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity: 'User',
      entityId: user._id,
      user: req.user,
      details: `${user.email} was ${user.isActive ? 'activated' : 'deactivated'}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

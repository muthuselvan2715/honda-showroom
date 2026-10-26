import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bikeModelRoutes from './bikeModel.routes.js';
import bikeUnitRoutes from './bikeUnit.routes.js';
import customerRoutes from './customer.routes.js';
import enquiryRoutes from './enquiry.routes.js';
import testRideRoutes from './testRide.routes.js';
import saleRoutes from './sale.routes.js';
import paymentRoutes from './payment.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reportRoutes from './report.routes.js';
import settingsRoutes from './settings.routes.js';
import auditRoutes from './audit.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bike-models', bikeModelRoutes);
router.use('/bike-units', bikeUnitRoutes);
router.use('/customers', customerRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/test-rides', testRideRoutes);
router.use('/sales', saleRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit-logs', auditRoutes);

export default router;

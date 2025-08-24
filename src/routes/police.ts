import { Router } from 'express';
import { PoliceController } from '../controllers/policeController';
import { policeAuthMiddleware } from '../middleware/auth';
import { validateRequest, validateQuery, validateParams, schemas } from '../middleware/validation';
import Joi from 'joi';
import { prisma } from '../utils/database';

const router = Router();
const policeController = new PoliceController();

// Apply auth dynamically per request so env flag takes effect reliably
router.use((req, res, next) => {
	if (process.env.PROTOTYPE_NO_AUTH === 'true') {
		return next();
	}
	return policeAuthMiddleware(req as any, res as any, next as any);
});

// Profile routes
router.get('/profile', policeController.getProfile);
router.put('/profile', policeController.updateProfile);

// Report routes
router.get('/reports', 
  validateQuery(schemas.reportFilters), 
  policeController.getReports
);

router.get('/reports/:id', 
  validateParams(schemas.reportId), 
  policeController.getReport
);

router.put('/reports/:id/status', 
  validateParams(schemas.reportId),
  validateRequest(schemas.updateReportStatus), 
  policeController.updateReportStatus
);

// Optional general edits endpoint for prototype
const updateReportSchema = Joi.object({
	violationType: Joi.string().optional(),
	severity: Joi.string().valid('MINOR','MAJOR','CRITICAL').optional(),
	description: Joi.string().max(500).optional(),
	timestamp: Joi.date().optional(),
	latitude: Joi.number().min(-90).max(90).optional(),
	longitude: Joi.number().min(-180).max(180).optional(),
	address: Joi.string().min(5).max(200).optional(),
	city: Joi.string().optional(),
	district: Joi.string().optional(),
	state: Joi.string().optional(),
	vehicleNumber: Joi.string().optional(),
	vehicleType: Joi.string().optional(),
	vehicleColor: Joi.string().optional(),
	photoUrl: Joi.string().uri().optional(),
	videoUrl: Joi.string().uri().optional()
});

router.put('/reports/:id',
	validateParams(schemas.reportId),
	validateRequest(updateReportSchema),
	async (req, res) => {
		try {
			const { id } = req.params as any;
			const data = req.body as any;
			const updated = await prisma.violationReport.update({
				where: { id: Number(id) },
				data
			});
			return res.json({ success: true, data: updated, message: 'Report updated successfully' });
		} catch (error) {
			return res.status(500).json({ success: false, error: 'Failed to update report' });
		}
	}
);

// Report events: list history for a report (police)
router.get('/reports/:id/events', async (req, res) => {
	try {
		const { id } = req.params as any;
		const events = await (prisma as any).reportEvent.findMany({
			where: { reportId: Number(id) },
			orderBy: { createdAt: 'asc' }
		});
		return res.json({ success: true, data: events });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to fetch events' });
	}
});

// Report comments: list and add
router.get('/reports/:id/comments', async (req, res) => {
	try {
		const { id } = req.params as any;
		const comments = await (prisma as any).reportComment.findMany({
			where: { reportId: Number(id) },
			orderBy: { createdAt: 'asc' }
		});
		return res.json({ success: true, data: comments });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to fetch comments' });
	}
});

const createCommentSchema = Joi.object({
	message: Joi.string().min(1).max(1000).required(),
	isInternal: Joi.boolean().default(false)
});

router.post('/reports/:id/comments', validateRequest(createCommentSchema), async (req, res) => {
	try {
		const { id } = req.params as any;
		const { message, isInternal } = req.body as any;
		const author = (req as any).user || null;
		const authorId = author?.id || null;
		const authorName = author?.name || null;
		const comment = await (prisma as any).reportComment.create({
			data: { reportId: Number(id), authorId, authorName, message, isInternal }
		});
		// Log as event as well
		await (prisma as any).reportEvent.create({
			data: {
				reportId: Number(id),
				type: 'FEEDBACK_ADDED',
				title: 'Comment added',
				description: message,
				metadata: JSON.stringify({ isInternal, authorName }),
				userId: authorId
			}
		});
		return res.status(201).json({ success: true, data: comment });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to add comment' });
	}
});

// Dashboard routes
router.get('/dashboard', policeController.getDashboard);
router.get('/dashboard/violation-types', policeController.getViolationTypeStats);
router.get('/dashboard/geographic', policeController.getGeographicStats);
router.get('/dashboard/officer-performance', policeController.getOfficerPerformance);

// Enhanced Dashboard routes with flexible time ranges
router.get('/dashboard/overview', policeController.getDashboardOverview);
router.get('/dashboard/weekly-trend', policeController.getWeeklyTrend);
router.get('/dashboard/monthly-trend', policeController.getMonthlyTrend);
router.get('/dashboard/recent-activity', policeController.getRecentActivity);
router.get('/dashboard/violation-types-trend', policeController.getViolationTypesTrend);

// Vehicle information routes
router.get('/vehicles/:number', policeController.getVehicleInfo);

export default router;


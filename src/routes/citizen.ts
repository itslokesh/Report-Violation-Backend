import { Router } from 'express';
import { CitizenController } from '../controllers/citizenController';
import { citizenAuthMiddleware } from '../middleware/auth';
import { validateRequest, validateQuery, validateParams, schemas } from '../middleware/validation';
import { prisma } from '../utils/database';

const router = Router();
const citizenController = new CitizenController();

// Apply authentication middleware to all routes
router.use(citizenAuthMiddleware);

// Profile routes
router.get('/profile', citizenController.getProfile);
router.put('/profile', citizenController.updateProfile);

// Report routes
router.post('/reports', 
  validateRequest(schemas.createReport), 
  citizenController.submitReport
);

router.get('/reports', 
  validateQuery(schemas.pagination), 
  citizenController.getMyReports
);

router.get('/reports/:id', 
  validateParams(schemas.reportId), 
  citizenController.getReport
);

// Rewards routes
router.get('/rewards', citizenController.getRewards);

// Duplicate group routes
router.get('/duplicates/:duplicateGroupId', citizenController.getDuplicateGroup);

// New: list all points transactions (paginated)
router.get('/rewards/transactions', async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query as any;
		const citizenId = (req as any).user.id;
		const skip = (Number(page) - 1) * Number(limit);
		const [items, total] = await Promise.all([
			(await import('../utils/database')).prisma.pointsTransaction.findMany({
				where: { citizenId },
				orderBy: { createdAt: 'desc' },
				skip,
				take: Number(limit)
			}),
			(await import('../utils/database')).prisma.pointsTransaction.count({ where: { citizenId } })
		]);
		return res.json({ success: true, data: { transactions: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
	}
});

// New: redeem points (creates a negative transaction and updates balances)
router.post('/rewards/redeem', async (req, res) => {
	try {
		const citizenId = (req as any).user.id;
		const { points, description } = req.body as any;
		if (!points || Number(points) <= 0) {
			return res.status(400).json({ success: false, error: 'Points must be a positive number' });
		}
		const { prisma } = await import('../utils/database');
		const citizen = await prisma.citizen.findUnique({ where: { id: citizenId } });
		if (!citizen) return res.status(404).json({ success: false, error: 'Citizen not found' });
		if (citizen.totalPoints < Number(points)) {
			return res.status(400).json({ success: false, error: 'Insufficient points' });
		}
		const newTotal = citizen.totalPoints - Number(points);
		const newRedeemed = citizen.pointsRedeemed + Number(points);
		await prisma.citizen.update({ where: { id: citizenId }, data: { totalPoints: newTotal, pointsRedeemed: newRedeemed } });
		const tx = await prisma.pointsTransaction.create({
			data: {
				citizenId,
				type: 'REDEEM',
				reportId: null,
				points: -Number(points),
				description: description || `Redeemed ${points} points`,
				balanceAfter: newTotal
			}
		});
		return res.status(201).json({ success: true, data: { transaction: tx, balance: newTotal } });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to redeem points' });
	}
});

// Report events: list history for a report (citizen, only own report)
router.get('/reports/:id/events', async (req, res) => {
	try {
		const citizenId = (req as any).user.id;
		const { id } = req.params as any;
		const report = await prisma.violationReport.findFirst({ where: { id: Number(id), citizenId } });
		if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
		const events = await (prisma as any).reportEvent.findMany({ where: { reportId: Number(id) }, orderBy: { createdAt: 'asc' } });
		return res.json({ success: true, data: events });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to fetch events' });
	}
});

// Notifications: list latest for citizen
router.get('/notifications', async (req, res) => {
	try {
		const citizenId = (req as any).user.id;
		const { page = 1, limit = 20 } = req.query as any;
		const skip = (Number(page) - 1) * Number(limit);
		// TTL: prune notifications older than 7 days for this citizen
		await (prisma as any).notification.deleteMany({ where: { citizenId, OR: [ { expiresAt: { lt: new Date() } }, { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } ] } });
		const [items, total] = await Promise.all([
			(prisma as any).notification.findMany({
				where: { citizenId },
				orderBy: { createdAt: 'desc' },
				skip,
				take: Number(limit)
			}),
			(prisma as any).notification.count({ where: { citizenId } })
		]);
		return res.json({ success: true, data: { notifications: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
	}
});

// Mark notification as read: delete the record
router.patch('/notifications/:id/read', async (req, res) => {
	try {
		const citizenId = (req as any).user.id;
		const { id } = req.params as any;
		const deleted = await (prisma as any).notification.deleteMany({ where: { id, citizenId } });
		return res.json({ success: true, data: { deleted: deleted.count } });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
	}
});

// Mark all notifications as read: delete all for this citizen
router.patch('/notifications/read-all', async (req, res) => {
	try {
		const citizenId = (req as any).user.id;
		const result = await (prisma as any).notification.deleteMany({ where: { citizenId } });
		return res.json({ success: true, data: { deleted: result.count } });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Failed to mark all notifications as read' });
	}
});

export default router;


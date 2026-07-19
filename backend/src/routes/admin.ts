import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/authenticate';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const [users, restaurants, orders, pendingRestaurants] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count({ where: { isApproved: true } }),
      prisma.order.count(),
      prisma.restaurant.count({ where: { isApproved: false } }),
    ]);
    const revenue = await prisma.order.aggregate({
      _sum: { commission: true },
      where: { status: 'DELIVERED' }
    });
    res.json({
      totalUsers: users,
      approvedRestaurants: restaurants,
      totalOrders: orders,
      pendingApprovals: pendingRestaurants,
      platformRevenue: revenue._sum.commission || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/subscription-plans
router.get('/subscription-plans', async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: 'asc' } });
    res.json(plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.priceMonthly,
      commissionRate: p.commissionRate,
      billingCycle: 'MONTHLY',
      description: p.features[0] || '',
      features: p.features,
      isActive: true,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/subscription-plans
router.post('/subscription-plans', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, commissionRate, features, billingCycle } = req.body;
    const tierMap: Record<string, any> = { STARTER: 'STARTER', PRO: 'PRO', PREMIUM: 'PREMIUM', ENTERPRISE: 'ENTERPRISE' };
    const tier = tierMap[name.toUpperCase()] || 'STARTER';

    const plan = await prisma.subscriptionPlan.upsert({
      where: { tier },
      create: {
        tier,
        name,
        priceMonthly: price,
        priceYearly: price * 10,
        commissionRate: commissionRate || 10,
        features: features || [],
      },
      update: {
        name,
        priceMonthly: price,
        commissionRate: commissionRate || 10,
        features: features || [],
      }
    });
    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/subscription-plans/:id
router.put('/subscription-plans/:id', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, commissionRate, features } = req.body;
    const plan = await prisma.subscriptionPlan.update({
      where: { id: req.params.id },
      data: {
        name,
        priceMonthly: price,
        commissionRate,
        features: features || [],
      }
    });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/subscription-plans/:id
router.delete('/subscription-plans/:id', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.subscriptionPlan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, email: true } } }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/support-tickets
router.get('/support-tickets', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/support-tickets/:id/reply
router.put('/support-tickets/:id/reply', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { reply, status } = req.body;
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { reply, status: status || 'RESOLVED' }
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customerProfile: true, deliveryPartner: true }
    });
    res.json(users.map(u => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
      createdAt: u.createdAt,
      isApproved: u.deliveryPartner?.isApproved ?? true,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/drivers
router.get('/drivers', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const drivers = await prisma.deliveryPartner.findMany({
      include: { user: true, wallet: true },
      orderBy: { userId: 'desc' }
    });
    res.json(drivers.map(d => ({
      id: d.id,
      name: d.user.name,
      email: d.user.email,
      phone: d.user.phone,
      vehicleType: d.vehicleType,
      isOnline: d.isOnline,
      isApproved: d.isApproved,
      walletBalance: d.wallet.balance,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/authenticate';

const router = Router();

// GET /api/drivers/me — current driver profile
router.get('/me', authenticate, requireRole('DELIVERY_PARTNER'), async (req: AuthRequest, res: Response) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
      include: { user: true, wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } } } }
    });
    if (!partner) return res.status(404).json({ error: 'Driver not found' });
    res.json({
      id: partner.id,
      name: partner.user.name,
      email: partner.user.email,
      phone: partner.user.phone,
      vehicleType: partner.vehicleType,
      vehiclePlate: partner.vehiclePlate,
      isOnline: partner.isOnline,
      isApproved: partner.isApproved,
      currentLat: partner.currentLat,
      currentLng: partner.currentLng,
      wallet: { balance: partner.wallet.balance, transactions: partner.wallet.transactions },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/drivers/online — toggle online status
router.put('/online', authenticate, requireRole('DELIVERY_PARTNER'), async (req: AuthRequest, res: Response) => {
  try {
    const { isOnline } = req.body;
    const partner = await prisma.deliveryPartner.update({
      where: { userId: req.user!.userId },
      data: { isOnline }
    });
    res.json({ success: true, isOnline: partner.isOnline });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/drivers/location — update GPS coordinates
router.put('/location', authenticate, requireRole('DELIVERY_PARTNER'), async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng } = req.body;
    await prisma.deliveryPartner.update({
      where: { userId: req.user!.userId },
      data: { currentLat: lat, currentLng: lng }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/drivers/orders/:orderId/accept — driver accepts an order
router.post('/orders/:orderId/accept', authenticate, requireRole('DELIVERY_PARTNER'), async (req: AuthRequest, res: Response) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) return res.status(404).json({ error: 'Driver not found' });

    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { driverId: partner.id, status: 'PICKED_UP' }
    });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

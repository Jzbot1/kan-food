import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/authenticate';

const router = Router();

// POST /api/orders — place order
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId, items, paymentMethod, deliveryAddress, deliveryLat, deliveryLng, deliveryFee, discount, tip } = req.body;

    const profile = await prisma.customerProfile.findUnique({ where: { userId: req.user!.userId }, include: { wallet: true } });
    if (!profile) return res.status(400).json({ error: 'Customer profile not found' });

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant || !restaurant.isApproved) return res.status(400).json({ error: 'Restaurant not available' });

    const subtotal = (items as any[]).reduce((sum, item) => sum + item.price * item.quantity, 0);
    const fee = deliveryFee ?? 39;
    const disc = discount ?? 0;
    const tipAmt = tip ?? 0;
    const commission = parseFloat((subtotal * (restaurant.commissionRate / 100)).toFixed(2));
    const totalAmount = parseFloat((subtotal + fee - disc + tipAmt).toFixed(2));

    if (paymentMethod === 'WALLET') {
      if (profile.wallet.balance < totalAmount) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const newOrder = await tx.order.create({
        data: {
          customerId: profile.id,
          restaurantId,
          status: 'PENDING',
          deliveryFee: fee,
          tax: 0,
          discount: disc,
          commission,
          totalAmount,
          paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
          otp,
          deliveryAddress: deliveryAddress || 'Default Address',
          deliveryLat: deliveryLat ?? 0,
          deliveryLng: deliveryLng ?? 0,
          items: {
            create: (items as any[]).map(item => ({
              foodId: item.foodId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              variants: item.variants || [],
              addons: item.addons || [],
            }))
          }
        },
        include: { items: true }
      });

      // Deduct wallet if payment method is WALLET
      if (paymentMethod === 'WALLET') {
        await tx.wallet.update({
          where: { id: profile.walletId },
          data: {
            balance: { decrement: totalAmount },
            transactions: {
              create: {
                amount: totalAmount,
                type: 'DEBIT',
                description: `Order #${newOrder.id.slice(-6)} payment`,
                referenceId: newOrder.id
              }
            }
          }
        });
      }

      return newOrder;
    });

    res.status(201).json({ success: true, order: mapOrder(order as any) });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/mine — customer's orders
router.get('/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.customerProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.json([]);

    const orders = await prisma.order.findMany({
      where: { customerId: profile.id },
      include: { items: true, restaurant: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders.map(mapOrder));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/restaurant/:id — restaurant's orders
router.get('/restaurant/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { restaurantId: req.params.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders.map(mapOrder));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/driver — driver's orders
router.get('/driver', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) return res.json([]);

    const orders = await prisma.order.findMany({
      where: { driverId: partner.id },
      include: { items: true, restaurant: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders.map(mapOrder));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/available — available orders for drivers
router.get('/available', authenticate, requireRole('DELIVERY_PARTNER'), async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'READY', driverId: null },
      include: { items: true, restaurant: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders.map(mapOrder));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/orders/:id/status — update order status
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, driverId, otp } = req.body;

    const currentOrder = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!currentOrder) return res.status(404).json({ error: 'Order not found' });

    // OTP verification for delivery completion
    if (status === 'DELIVERED') {
      if (otp !== currentOrder.otp) {
        return res.status(400).json({ error: 'Invalid OTP. Delivery cannot be completed.' });
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: req.params.id },
        data: {
          status,
          ...(driverId ? { driverId } : {}),
          paymentStatus: status === 'DELIVERED' ? 'PAID' : currentOrder.paymentStatus
        },
        include: { items: true, restaurant: true }
      });

      // Credit restaurant wallet on delivery
      if (status === 'DELIVERED') {
        const restaurant = await tx.restaurant.findUnique({
          where: { id: order.restaurantId },
          include: { wallet: true }
        });
        if (restaurant) {
          const restaurantEarning = order.totalAmount - order.deliveryFee - order.commission;
          await tx.wallet.update({
            where: { id: restaurant.walletId },
            data: {
              balance: { increment: restaurantEarning },
              transactions: {
                create: {
                  amount: restaurantEarning,
                  type: 'CREDIT',
                  description: `Order #${order.id.slice(-6)} earnings`,
                  referenceId: order.id
                }
              }
            }
          });
        }
      }

      return order;
    });

    res.json({ success: true, order: mapOrder(updatedOrder as any) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/all — all orders (admin)
router.get('/all', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true, restaurant: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(orders.map(mapOrder));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

function mapOrder(o: any) {
  return {
    id: o.id,
    customerId: o.customerId,
    restaurantId: o.restaurantId,
    driverId: o.driverId,
    status: o.status,
    items: (o.items || []).map((item: any) => ({
      id: item.id,
      foodId: item.foodId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      variants: item.variants || [],
      addons: item.addons || [],
    })),
    deliveryFee: o.deliveryFee,
    tax: o.tax,
    discount: o.discount,
    commission: o.commission,
    total: o.totalAmount,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    otp: o.otp,
    deliveryAddress: o.deliveryAddress,
    createdAt: o.createdAt,
    restaurantName: o.restaurant?.name,
  };
}

export default router;

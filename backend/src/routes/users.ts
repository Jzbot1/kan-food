import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

// GET /api/users/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        customerProfile: { include: { wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } } } },
        deliveryPartner: { include: { wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } } } },
        addresses: { orderBy: { isDefault: 'desc' } }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      rewardPoints: user.customerProfile?.rewardPoints ?? 0,
      membershipTier: user.customerProfile?.membershipTier ?? 'REGULAR',
      wallet: user.customerProfile?.wallet || user.deliveryPartner?.wallet || null,
      addresses: user.addresses,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/me
router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, dob, gender, preferredLanguage, membershipTier } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { ...(name && { name }), ...(phone && { phone }) }
    });
    if (membershipTier && (membershipTier === 'PRIME' || membershipTier === 'REGULAR')) {
      await prisma.customerProfile.updateMany({
        where: { userId: req.user!.userId },
        data: { membershipTier }
      });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/addresses
router.get('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const addresses = await prisma.userAddress.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/addresses
router.post('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false }
      });
    }
    const address = await prisma.userAddress.create({
      data: { ...data, userId: req.user!.userId }
    });
    res.status(201).json(address);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/addresses/:id
router.put('/addresses/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false }
      });
    }
    const address = await prisma.userAddress.update({
      where: { id: req.params.id },
      data
    });
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/addresses/:id
router.delete('/addresses/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.userAddress.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/wallet/topup
router.post('/wallet/topup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const profile = await prisma.customerProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(400).json({ error: 'Profile not found' });

    const wallet = await prisma.wallet.update({
      where: { id: profile.walletId },
      data: {
        balance: { increment: amount },
        transactions: {
          create: {
            amount,
            type: 'CREDIT',
            description: 'Wallet top-up',
          }
        }
      }
    });
    res.json({ success: true, balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

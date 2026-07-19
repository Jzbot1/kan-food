import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/auth';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const allowedRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER'];
    const userRole = allowedRoles.includes(role) ? role : 'CUSTOMER';

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });
    if (existing) {
      return res.status(409).json({ error: 'Email or phone already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, phone, passwordHash, role: userRole as any }
      });

      if (userRole === 'CUSTOMER') {
        const wallet = await tx.wallet.create({
          data: { type: 'CUSTOMER', balance: 0 }
        });
        await tx.customerProfile.create({
          data: { userId: newUser.id, walletId: wallet.id, rewardPoints: 0 }
        });
      }

      if (userRole === 'DELIVERY_PARTNER') {
        const wallet = await tx.wallet.create({
          data: { type: 'DRIVER', balance: 0 }
        });
        await tx.deliveryPartner.create({
          data: {
            userId: newUser.id,
            walletId: wallet.id,
            vehicleType: 'BIKE',
            isOnline: false,
            isApproved: false
          }
        });
      }

      return newUser;
    });

    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { customerProfile: { include: { wallet: true } } }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ userId: user.id, role: user.role });

    await prisma.auditLog.create({
      data: { userId: user.id, action: `User logged in: ${user.email}` }
    }).catch(() => {});

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        rewardPoints: user.customerProfile?.rewardPoints ?? 0,
        membershipTier: user.customerProfile?.membershipTier ?? 'REGULAR',
        walletId: user.customerProfile?.walletId,
        walletBalance: user.customerProfile?.wallet?.balance ?? 0,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        customerProfile: { include: { wallet: true } },
        deliveryPartner: { include: { wallet: true } },
        addresses: { orderBy: { createdAt: 'desc' } }
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
      walletBalance: user.customerProfile?.wallet?.balance ?? user.deliveryPartner?.wallet?.balance ?? 0,
      addresses: user.addresses,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

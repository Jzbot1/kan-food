import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/authenticate';

const router = Router();

// GET /api/restaurants — all approved restaurants (public)
router.get('/', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isApproved: true },
      include: {
        foodCategories: {
          include: {
            foods: { include: { variants: true, addons: true } }
          }
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = restaurants.map(r => mapRestaurant(r));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/pending — pending restaurants (admin only)
router.get('/pending', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isApproved: false },
      include: { foodCategories: true, subscriptions: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(restaurants.map(mapRestaurant));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/mine — current user's restaurants
router.get('/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: req.user!.userId },
      include: {
        foodCategories: {
          include: { foods: { include: { variants: true, addons: true } } }
        },
        wallet: true,
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
    res.json(restaurants.map(r => mapRestaurant(r)));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: {
        foodCategories: { include: { foods: { include: { variants: true, addons: true } } } },
        wallet: true,
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(mapRestaurant(restaurant));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/restaurants — apply for new restaurant
router.post('/', authenticate, requireRole('RESTAURANT_OWNER', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, address, lat, lng, deliveryRadius, logo, banner, commissionRate } = req.body;

    const restaurant = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.create({ data: { type: 'RESTAURANT', balance: 0 } });

      const rest = await tx.restaurant.create({
        data: {
          ownerId: req.user!.userId,
          name,
          description: description || '',
          address,
          latitude: lat || 0,
          longitude: lng || 0,
          deliveryRadius: deliveryRadius || 5,
          logoUrl: logo || '',
          bannerUrl: banner || '',
          commissionRate: commissionRate || 10.0,
          isApproved: false,
          isVerified: false,
          walletId: wallet.id,
        }
      });

      await tx.auditLog.create({
        data: { userId: req.user!.userId, action: `Restaurant application submitted: ${name}` }
      });

      return rest;
    });

    res.status(201).json(mapRestaurant(restaurant as any));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/restaurants/:id/approve — approve (admin)
router.put('/:id/approve', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { isApproved: true }
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: `Restaurant approved: ${restaurant.name}` }
    }).catch(() => {});
    res.json({ success: true, restaurant: mapRestaurant(restaurant as any) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/restaurants/:id/menu — add food item
router.post('/:id/menu', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, image, isVeg, isBestseller, category, variants, addons } = req.body;

    // Check restaurant ownership
    const rest = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!rest) return res.status(404).json({ error: 'Restaurant not found' });
    if (rest.ownerId !== req.user!.userId && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Find or create food category
    let cat = await prisma.foodCategory.findFirst({
      where: { restaurantId: req.params.id, name: category || 'General' }
    });
    if (!cat) {
      cat = await prisma.foodCategory.create({
        data: { restaurantId: req.params.id, name: category || 'General' }
      });
    }

    const food = await prisma.food.create({
      data: {
        categoryId: cat.id,
        name,
        description: description || '',
        price,
        imageUrl: image || '',
        isVeg: isVeg ?? true,
        isBestseller: isBestseller ?? false,
        isAvailable: true,
        variants: variants?.length ? { create: variants } : undefined,
        addons: addons?.length ? { create: addons } : undefined,
      },
      include: { variants: true, addons: true }
    });

    res.status(201).json(food);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/restaurants/:id/menu/:foodId
router.delete('/:id/menu/:foodId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.food.delete({ where: { id: req.params.foodId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

function mapRestaurant(r: any) {
  const sub = r.subscriptions?.[0];
  return {
    id: r.id,
    ownerId: r.ownerId,
    name: r.name,
    description: r.description,
    logo: r.logoUrl || '',
    banner: r.bannerUrl || '',
    rating: r.rating,
    reviewsCount: r.reviewsCount || 0,
    commissionRate: r.commissionRate,
    isApproved: r.isApproved,
    isVerified: r.isVerified,
    address: r.address,
    lat: r.latitude,
    lng: r.longitude,
    deliveryRadius: r.deliveryRadius,
    walletId: r.walletId,
    walletBalance: r.wallet?.balance ?? 0,
    subscriptionPlan: sub?.plan?.name || 'Starter Kitchen Pack',
    subscriptionExpires: sub?.expiresAt?.toISOString() || new Date(Date.now() + 86400000 * 30).toISOString(),
    categories: r.foodCategories?.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
    })) || [],
    menu: r.foodCategories?.flatMap((cat: any) =>
      (cat.foods || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        price: f.price,
        image: f.imageUrl || '',
        isVeg: f.isVeg,
        isBestseller: f.isBestseller,
        isAvailable: f.isAvailable,
        category: cat.name,
        variants: f.variants || [],
        addons: f.addons || [],
      }))
    ) || [],
    createdAt: r.createdAt,
  };
}

export default router;

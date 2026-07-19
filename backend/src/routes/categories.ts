import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/authenticate';

const router = Router();

// GET /api/categories — list all global food categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.globalFoodCategory.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories — create category (admin only)
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const category = await prisma.globalFoodCategory.create({ data: { name, description } });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/categories/:id — update category (admin only)
router.put('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.globalFoodCategory.update({
      where: { id: req.params.id },
      data: { name, description }
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id — delete category (admin only)
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.globalFoodCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

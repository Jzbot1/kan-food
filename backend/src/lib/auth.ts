import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'shipbite_secret';

export const signToken = (payload: { userId: string; role: string }): string => {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: string; role: string } | null => {
  try {
    return jwt.verify(token, SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
};

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({
    status: 'OK',
    message: 'VidyaMark API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};

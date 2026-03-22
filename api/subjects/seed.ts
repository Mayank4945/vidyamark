import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { extractToken, verifyToken } from '../../_lib/auth';

const DEFAULT_SUBJECTS = [
  { code: 'HINDI', name: 'Hindi', description: 'Hindi Language and Literature' },
  { code: 'ENG', name: 'English', description: 'English Language and Literature' },
  { code: 'MATH', name: 'Mathematics', description: 'Mathematics and Numeracy' },
  { code: 'SCI', name: 'Science', description: 'General Science' },
  { code: 'SOCSCI', name: 'Social Science', description: 'History, Geography, Civics' },
  { code: 'SANSKRIT', name: 'Sanskrit', description: 'Sanskrit Language and Literature' },
  { code: 'URDU', name: 'Urdu', description: 'Urdu Language and Literature' },
  { code: 'HOMESCI', name: 'Home Science', description: 'Home Science and Family Welfare' },
  { code: 'CA', name: 'Computer Application', description: 'Computer Applications and IT' },
];

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const seededSubjects = [];
      
      for (const subject of DEFAULT_SUBJECTS) {
        try {
          const result = await query(
            'INSERT INTO subjects (code, name, description) VALUES ($1, $2, $3) RETURNING * ON CONFLICT (code) DO NOTHING',
            [subject.code, subject.name, subject.description]
          );
          if (result.rows.length > 0) {
            seededSubjects.push(result.rows[0]);
          }
        } catch (err) {
          // Continue seeding other subjects even if one fails
          console.log(`Subject ${subject.code} already exists or error occurred`);
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Subjects seeded successfully',
        data: seededSubjects,
        count: seededSubjects.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

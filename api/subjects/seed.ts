import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';

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
  if (req.method === 'POST') {
    try {
      // Check if subjects already exist
      const existingResult = await query('SELECT COUNT(*) as count FROM subjects');
      const existingCount = parseInt(existingResult.rows[0].count);
      
      if (existingCount > 0) {
        return res.status(200).json({
          success: true,
          message: 'Subjects already exist in database',
          data: [],
          count: 0
        });
      }

      // Seed all default subjects
      const seededSubjects = [];
      
      for (const subject of DEFAULT_SUBJECTS) {
        try {
          const result = await query(
            'INSERT INTO subjects (code, name, description) VALUES ($1, $2, $3) RETURNING *',
            [subject.code, subject.name, subject.description]
          );
          if (result.rows.length > 0) {
            seededSubjects.push(result.rows[0]);
          }
        } catch (err) {
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

import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './database';

/**
 * Initialize database schema
 * Reads schema.sql and executes it on the database
 * Note: PostgreSQL allows executing the entire script at once
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...');
    
    // Read schema file
    const schemaPath = join(__dirname, '../../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute entire schema as one query
    // PostgreSQL can handle multiple statements separated by semicolons in one query
    await pool.query(schema);
    
    console.log('✅ Database schema initialization complete!');
    return true;
  } catch (error: any) {
    // Ignore errors related to already existing objects
    if (error?.code === '42P07' || error?.message?.includes('already exists')) {
      console.log('⚠️  Schema objects already exist');
      return true;
    }
    console.error('❌ Database initialization error:', error?.message);
    // Don't throw - continue even if schema init fails (tables might already exist)
    return false;
  }
}

/**
 * Seed default subjects (Global, shared across all schools)
 */
export async function seedDefaultSubjects() {
  try {
    console.log('🌱 Seeding default subjects...');
    
    const defaultSubjects = [
      { name: 'Hindi', code: 'HINDI' },
      { name: 'English', code: 'ENGLISH' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Science', code: 'SCIENCE' },
      { name: 'Social Science', code: 'SOSCIENCE' },
      { name: 'Sanskrit', code: 'SANSKRIT' },
      { name: 'Urdu', code: 'URDU' },
      { name: 'Home Science', code: 'HOMESCIENCE' },
      { name: 'Computer Application', code: 'COMPAPP' }
    ];

    let createdCount = 0;

    for (const subject of defaultSubjects) {
      const result = await pool.query(
        `INSERT INTO subjects (name, code)
         VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [subject.name, subject.code]
      );
      
      if (result.rows.length > 0) {
        createdCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`✅ Seeded ${createdCount} new subjects`);
    } else {
      console.log('✅ All subjects already exist');
    }
    
    return true;
  } catch (error: any) {
    console.error('⚠️  Error seeding subjects:', error?.message);
    // Don't throw - continue even if seeding fails
    return false;
  }
}

/**
 * Verify database connection
 */
export async function verifyDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

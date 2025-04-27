import { initializeDatabase } from '../db/init';

async function main() {
  try {
    console.log('Initializing database...');
    const success = await initializeDatabase();
    
    if (success) {
      console.log('Database initialized successfully');
      process.exit(0);
    } else {
      console.error('Failed to initialize database');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main(); 
 
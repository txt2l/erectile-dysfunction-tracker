import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL,
});

export const db = drizzle(connection);

console.log('Database connection established via Drizzle + mysql2');

import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {id:text('id').primaryKey(),data:text('data').notNull()});
export const accounts=sqliteTable('accounts',{id:text('id').primaryKey(),studentId:text('student_id').notNull().unique(),username:text('username').notNull().unique()});

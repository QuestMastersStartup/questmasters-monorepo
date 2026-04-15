import 'reflect-metadata';
import AppDataSource from '../src/data-source';

await AppDataSource.initialize();
await AppDataSource.undoLastMigration({ transaction: 'each' });
await AppDataSource.destroy();

console.log('✅ Last migration reverted.');

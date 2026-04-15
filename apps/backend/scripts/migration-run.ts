import 'reflect-metadata';
import AppDataSource from '../src/data-source';

await AppDataSource.initialize();
const migrations = await AppDataSource.runMigrations({ transaction: 'each' });
await AppDataSource.destroy();

if (migrations.length === 0) {
  console.log('No pending migrations.');
} else {
  console.log(`✅ Ran ${migrations.length} migration(s):`);
  for (const m of migrations) console.log(`   - ${m.name}`);
}

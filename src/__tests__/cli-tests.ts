import {queryDatabaseMetadataJson} from "../dbmd-generation";

const dbConnectInfo = {
  host: process.env.PGHOST || 'localhost',
  port: +(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'drugs',
  user: process.env.PGUSER || 'drugs',
  password: process.env.PGPASSWORD || 'drugs'
};

test('Database metadata generation succeeds', async () => {
  const dbmd = await queryDatabaseMetadataJson(dbConnectInfo, '.*');
  expect(dbmd).toBeTruthy();
  // TODO Check metadata for expected contents, e.g. table cunt, some expected fks.
});

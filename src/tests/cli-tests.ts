import {queryDatabaseMetadataJson} from "../mod.ts";

const dbConnectInfo = {
  host: process.env.PGHOST || 'localhost',
  port: +(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'drugs',
  user: process.env.PGUSER || 'drugs',
  password: process.env.PGPASSWORD || 'drugs'
};

test('database metadata generation with unrestricted filter', async () => {
  const dbmd = JSON.parse(await queryDatabaseMetadataJson(dbConnectInfo, '.*'));

  expect(new Set(dbmd.relationMetadatas.map((rmd: any) => rmd.relationId.name))).toEqual(new Set([
    'authority', 'analyst', 'compound', 'advisory_type', 'drug', 'drug_reference', 'reference',
    'advisory', 'functional_category', 'drug_functional_category', 'brand', 'manufacturer'
  ]));
});

test('database metadata generation with restrictive table filter', async () => {
  const dbmd = JSON.parse(await queryDatabaseMetadataJson(dbConnectInfo, '^drugs\.(a|drug|brand)'));

  expect(new Set(dbmd.relationMetadatas.map((rmd: any) => rmd.relationId.name))).toEqual(new Set([
    'authority', 'analyst', 'advisory_type', 'drug', 'drug_reference',
    'advisory', 'drug_functional_category', 'brand'
  ]));
});

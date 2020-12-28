#!/usr/bin/env node
import * as fs from 'fs/promises';
import {Client} from 'pg';
import * as dotenv from 'dotenv';
import {parseAppArgs} from './args';

async function generate
  (
    outputFile: string
  )
  : Promise<void>
{
  const dbmdJson = await queryDatabaseMetadataJson();

  await fs.writeFile(outputFile, dbmdJson, "utf-8");
}

async function queryDatabaseMetadataJson(): Promise<string>
{
  const client = new Client()

  try
  {
    await client.connect()

    const res = await client.query(dbmdSql);

    const resRow = res.rows[0];

    const keys = Object.keys(resRow);
    if (keys.length !== 1)
      throw new Error(`Expected exactly one column in result, got ${keys.length} instead.`);

    return JSON.stringify(res.rows[0][keys[0]], null, 2);
  }
  finally
  {
    await client.end();
  }
}

const dbmdSql = `
with
ignoreSchemasQuery as (
  select unnest(array['pg_catalog', 'information_schema']) schema_name
),
relationMetadatasQuery as (
  select
    coalesce(json_agg(json_build_object(
      'relationId', json_build_object('schema', t.schemaname, 'name', t.tablename),
      'relationType', 'Table',
      'fields', (
        select
          coalesce(json_agg(json_build_object(
            'name', col.column_name,
            'databaseType', col.udt_name,
            'nullable', case col.is_nullable when 'NO' then false when 'YES' then true end,
            'primaryKeyPartNumber', (
              select kcu.ordinal_position
              from information_schema.key_column_usage kcu
              where
                kcu.column_name = col.column_name and
                kcu.constraint_name = (
                  select constraint_name
                  from information_schema.table_constraints tc
                  where tc.constraint_type = 'PRIMARY KEY' and
                    tc.table_schema = t.schemaname and
                    tc.table_name = t.tablename
                )
            ),
            'length', col.character_maximum_length,
            'precision', col.numeric_precision,
            'precisionRadix', col.numeric_precision_radix,
            'fractionalDigits', col.numeric_scale
          ) order by col.ordinal_position), '[]'::json)
        from information_schema.columns col
        where col.table_schema = t.schemaname and col.table_name = t.tablename
      ) -- fields property
    )), '[]'::json)
  from pg_tables t
  where t.schemaname not in (select * from ignoreSchemasQuery)
),
foreignKeysQuery as (
  select coalesce(json_agg(fk.obj), '[]'::json)
  from (
    select
      json_build_object(
        'constraintName', child_tc.constraint_name,
        'foreignKeyRelationId',
          json_build_object(
            'schema', child_tc.table_schema,
            'name', child_tc.table_name
          ),
        'primaryKeyRelationId',
          json_build_object(
            'schema', parent_tc.table_schema,
            'name', parent_tc.table_name
          ),
        'foreignKeyComponents',
          json_agg(
            json_build_object(
              'foreignKeyFieldName', child_fk_comp.column_name,
              'primaryKeyFieldName', parent_pk_comp.column_name
            )
            order by child_fk_comp.ordinal_position
          )
      ) obj
    from information_schema.table_constraints child_tc
    -- To-one join for parent's pk constraint schema and name.
    join information_schema.referential_constraints child_rc
      on  child_tc.constraint_schema = child_rc.constraint_schema
      and child_tc.constraint_name = child_rc.constraint_name
    -- To-one join for parent's pk constraint information.
    join information_schema.table_constraints parent_tc
      on  child_rc.unique_constraint_schema = parent_tc.constraint_schema
      and child_rc.unique_constraint_name = parent_tc.constraint_name
    -- To-many join for the field components of the foreign key in the child table.
    join information_schema.key_column_usage child_fk_comp
      on  child_tc.constraint_schema = child_fk_comp.constraint_schema
      and child_tc.constraint_name = child_fk_comp.constraint_name
    -- To-one join for the parent table fk field component which is matched to that of the child.
    join information_schema.key_column_usage parent_pk_comp
      on  child_rc.unique_constraint_schema = parent_pk_comp.constraint_schema
      and child_rc.unique_constraint_name = parent_pk_comp.constraint_name
      and child_fk_comp.position_in_unique_constraint = parent_pk_comp.ordinal_position
    where child_tc.constraint_type = 'FOREIGN KEY'
      and child_fk_comp.table_schema not in (select * from ignoreSchemasQuery)
    group by
      child_tc.table_schema,
      child_tc.table_name,
      parent_tc.table_name,
      parent_tc.table_schema,
      child_tc.constraint_name
  ) fk
)
-- main query
select json_build_object(
  'dbmsName', 'PostgreSQL',
  'dbmsVersion', split_part(version(), ' ', 2),
  'caseSensitivity', 'INSENSITIVE_STORED_LOWER',
  'relationMetadatas', (select * from relationMetadatasQuery),
  'foreignKeys', (select * from foreignKeysQuery)
)
`;

function printUsage(to: 'stderr' | 'stdout')
{
  const out = to === 'stderr' ? console.error : console.log;
  out(`Expected arguments: [options] ${reqdNamedParams.map(p => "--" + p).join(" ")}  <output-file>`);
  out(`Options: ${optlNamedParams.map(p => "--" + p).join(" ")}`);
}

/////////////
// Start
////////////

const reqdNamedParams: string[] = [];
const optlNamedParams = ['conn-env'];
const argsParseResult = parseAppArgs(process.argv.slice(2), reqdNamedParams, optlNamedParams, 1, 1);

if ( typeof argsParseResult === 'string' )
{
  if ( argsParseResult === 'help' )
  {
    console.log('Help requested:');
    printUsage('stdout');
    process.exit(0);
  }
  else // error
  {
    console.error(`Error: ${argsParseResult}`);
    process.exit(1);
  }
}

const envFile = argsParseResult['conn-env'];
const outputFile = argsParseResult._[0];

if ( envFile )
  dotenv.config({ path: envFile });

generate(outputFile)
.catch(err => {
  console.error(err);
  process.exit(1);
});

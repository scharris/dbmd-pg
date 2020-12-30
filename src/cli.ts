#!/usr/bin/env node
import * as dotenv from 'dotenv';
import {ClientConfig} from 'pg';
import {parseAppArgs} from './args';
import {generate} from './dbmd-generation';

function printUsage(to: 'stderr' | 'stdout')
{
  const out = to === 'stderr' ? console.error : console.log;
  out(`Expected arguments: [options] ${reqdNamedParams.map(p => "--" + p).join(" ")}  <output-file>`);
  out(`Options: ${optlNamedParams.map(p => "--" + p).join(" ")}`);
}

export function getConnectInfo(): ClientConfig
{
  return {
    host: process.env.PGHOST,
    port: +(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  };
}

/////////////
// Start
////////////

const reqdNamedParams: string[] = [];
const optlNamedParams = ['conn-env', 'table-pattern'];
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
const includeTablesPattern: string = argsParseResult['table-pattern'] || '.*';
const outputFile = argsParseResult._[0];

if ( envFile )
  dotenv.config({ path: envFile });

generate(getConnectInfo(), includeTablesPattern, outputFile)
.catch(err => {
  console.error(err);
  process.exit(1);
});
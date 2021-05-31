import {config} from 'https://deno.land/x/dotenv@v1.0.1/mod.ts';
import {ConnectionOptions} from "https://deno.land/x/postgres/mod.ts";
import {parseAppArgs} from './args.ts';
import {generateDatabaseMetadata} from './mod.ts';

function printUsage(to: 'stderr' | 'stdout')
{
  const out = to === 'stderr' ? console.error : console.log;
  out(`Expected arguments: [options] ${reqdNamedParams.map(p => "--" + p).join(" ")}  <output-file>`);
  out(`Options: ${optlNamedParams.map(p => "--" + p).join(" ")}`);
}

export function getConnectInfo(envObj: any): ConnectionOptions
{
  if ( envObj )
  {
    const db = envObj['PGDATABASE'];
    if ( db === undefined )
      throw new Error('PGDATABASE definition is missing.');
    const user = envObj['PGUSER'];
    if ( user === undefined ) throw new Error('PGUSER definition is missing.');
    const password = envObj['PGPASSWORD'];
    if ( password === undefined ) throw new Error('PGPASSWORD definition is missing.');
    return {
      hostname: envObj['PGHOST'] || 'localhost',
      port: +(envObj['PGPORT'] || 5432),
      database: db,
      user: user,
      password: password
    };
  }
  else
    return {
      hostname: Deno.env.get('PGHOST'),
      port: +(Deno.env.get('PGPORT') || 5432),
      database: Deno.env.get('PGDATABASE'),
      user: Deno.env.get('PGUSER'),
      password: Deno.env.get('PGPASSWORD')
    };
}

/////////////
// Start
////////////

const reqdNamedParams: string[] = [];
const optlNamedParams = ['conn-env', 'table-pattern'];
const parsedArgs = parseAppArgs(reqdNamedParams, optlNamedParams, 0);

if ( typeof parsedArgs === 'string' )
{
  if ( parsedArgs === 'help' )
  {
    console.log('Help requested:');
    printUsage('stdout');
    Deno.exit(0);
  }
  else // error
  {
    console.error(`Error: ${parsedArgs}`);
    Deno.exit(1);
  }
}

const envFile = parsedArgs['conn-env'];
const includeTablesPattern: string = parsedArgs['table-pattern'] || '.*';
const outputFile = parsedArgs._[0] as string;

const envObj : object | null = envFile ? config({path: envFile}) : null;

generateDatabaseMetadata(getConnectInfo(envObj), includeTablesPattern, outputFile)
.catch(err => {
  console.error(err);
  Deno.exit(1);
});

This package exposes a CLI command `dbmd-gen-pg` which generates database metadata
from a PostgreSQL database and stores the metadata to a file in json format.

```
dbmd-gen-pg --conn-env <env-file>  <output-file>
```

## Installation and usage
To install and save as a development dependency:
```
npm install -D dbmd-pg
```

To run the generator, one way is to run directly from the command line via npx:
```
npx run gen-dbmd
```

Another option is to add an npm script to your project that will be using the
database metadata:
```
# in package.json:
"scripts": {
  "gen-dbmd": "dbmd-gen-pg --conn-env db/connection.env dbmd.json",
  ...
```
Then generate the metadata file with `npm run gen-dbmd`.

## Connection environment variables file
The connection environment file passed to `conn-env` should define
the following environment variables:

```
PGHOST=<database-host-name>
PGDATABASE=<database-name>
PGUSER=<user>
PGPASSWORD=<password>
PGPORT=<database-port>
```

# Development

## Build
To build the package:
```
npm install
npm run build
```

## Run example
If you are able to run Docker containers, you can easily try the database metadata generation against
an included example database as follows.
```
npm run build-example-database
npm run example-database
```

Try connecting to the database via:
```
docker exec -it drugs-pg psql -U drugs
```
You should be able to execute a query such as `select * from drug;`. Enter `\q` to exit.

To generate database metadata for this example database:
```
npm run example
```

The database metadata will be written to file `example/dbmd.json`.

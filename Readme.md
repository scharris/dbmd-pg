Usage:
```
nix-shell # or otherwise just make sure deno is on your PATH
deno run -A src/cli.ts --conn-env src/tests/db/client.env ~/tmp/dbmd.json
```

## Connection environment variables file format
The connection environment file passed to `conn-env` should define
the following environment variables:

```
PGHOST=<database-host-name>
PGDATABASE=<database-name>
PGUSER=<user>
PGPASSWORD=<password>
PGPORT=<database-port>
```

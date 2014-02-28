nmc2couchdb
===========

Scrapes Namecoin into CouchDB, fairly hackish at the moment.

# Setup Instructions
`nmc.js` first checks for a passed config object, then it checks for a local
`settings.json` file and it finally falls back to __searching for the config file
at `~/.namecoin/namecoin.conf`.__ This should "just work" on most Unix systems. *

It dump.js assumes that you have a local CouchDB install which is world writable
and it pushes everything into a DB called 'bit'.  This is currently hardcoded
into dump.js.

## To a manually specify settings:
1. `cp settings-example.json settings.json`
2. Fill in config information in `settings.json`

or

````
echo '{
   "host": "localhost",
   "port": 8334,
   "user": "indolering",
   "pass": "jkklsfjsfasadf89u8jr98j98pp9898"
 }
' > settings.json
````

* It technically looks for the `/.namecoin/namecoin.conf` file in whatever
directory is listed in the `process.env.HOME` variable.
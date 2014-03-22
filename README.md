nmc2couchdb
===========

nmc2couchdb scrapes valid, non-expired Namecoin names blockchain into CouchDB. fairly hackish at the moment.

## Init

### Install

You can install nmc2couch using NPM:

`npm install nmc2couch`

 or with Git:

`npm install https://github.com/indolering/nmc2couch.git`

### Setup

`nmc.js` first checks for a passed config object, then it checks for a local
`nmc.js/settings.json` file and it finally falls back to __searching for the
config file at `~/.namecoin/namecoin.conf`.__ This should "just work" on most
Unix systems. *

It dump.js assumes that you have a local CouchDB install which is world writable
and it pushes everything into a DB called 'bit'.  This is currently hardcoded
into dump.js.

#### Manually specify settings
You can also manually specify the JSON RPC settings:

1. `cp settings-example.json settings.json`
2. Fill in config information in `settings.json`

or

````
echo '{
   "host": "localhost",
   "port": 8334,
   "user": "YOUR USERNAME",
   "pass": "YOUR PASSWORD"
 }
' > settings.json
````

* It technically looks for the `/.namecoin/namecoin.conf` file in whatever
directory is listed in the `process.env.HOME` variable.


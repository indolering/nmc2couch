nmc2couchdb
===========

nmc2couchdb scrapes valid, non-expired Namecoin names blockchain into CouchDB. fairly hackish at the moment.

## Init

### Install

You can install nmc2couch using Git:

`npm install https://github.com/indolering/nmc2couch.git`

or via NPM:

`sudo npm install --global nmc2couch`


### Setup

`nmc.js` first checks for a passed config object, then it checks for a local
`nmc.js/namecoin-settings.json` file and it finally falls back to __searching for the
config file at `~/.namecoin/namecoin.conf`.__ This should "just work" on most
Unix systems. *

nmc2couch assumes that you have a local CouchDB install which is world writable
and it pushes everything into a DB called 'bit'.  This is currently hardcoded
into nmc2couch.

#### Manually specify settings
You can also manually specify the JSON RPC settings:

1. `cp namecoin-settings-example.json namecoin-settings.json`
2. Fill in config information in `namecoin-settings.json`

or just use this one-liner:

````
echo '{
   "host": "localhost",
   "port": 8334,
   "user": "YOUR USERNAME",
   "pass": "YOUR PASSWORD"
 }
' > namecoin-settings.json
````

* It technically looks for the `/.namecoin/namecoin.conf` file in whatever
directory is listed in the `process.env.HOME` variable.


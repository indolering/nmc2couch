nmc2couchdb
===========

nmc2couchdb scrapes valid, non-expired Namecoin names blockchain into CouchDB. fairly hackish at the moment.

## Init

### Install

You can install nmc2couch using Git:

`git clone https://github.com/indolering/nmc2couch.git`

or via NPM:

`sudo npm install --global nmc2couch`


### Setup

#### Specify JSON RPC settings
`nmc.js` first checks for a passed config object, then it checks for a local
`nmc.js/namecoin-settings.json` file and it finally falls back to __searching for the
config file at `~/.namecoin/namecoin.conf`.__ This should "just work" on most
Unix systems. *

You can create the local `./namecoin-settings.json` thusly:

1. `cp namecoin-settings-example.json namecoin-settings.json`
2. Fill in config information in `namecoin-settings.json`

or just use this one-liner while in the project directory:

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

#### Specify CouchDB settings
By default, nmc2couch assumes that you have a local CouchDB install which is
world writable and it pushes everything into a DB called 'bit'.

You can manually specify those via a couchdb-settings.json file.

1. `cp couchdb-settings-example.json couchdb-settings.json`
2. Fill in config information in `couchdb-settings.json`

or just use this one-liner while in the project directory:

````
echo '{
  "dbname": "bit",
  "user"  : "YOUR COUCHDB USERNAME",
  "pass"  : "YOUR COUCHDB PASSWORD",
  "https" : false,
  "port"  : "80",
  "uri"   : ""
 }
' > couchdb-settings.json
````


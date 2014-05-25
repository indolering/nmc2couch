nmc2couch
=========

nmc2couch scrapes valid, non-expired Namecoin names blockchain into CouchDB.  It also has a script for CouchDB which
filters invalid domain records.

## Init

### Install

You can install nmc2couch using Git:

```
git clone https://github.com/indolering/nmc2couch.git
cd nmc2couch
npm install
```

or via NPM (note the default config requirements):

`sudo npm install --global nmc2couch`


### Setup

#### Namecoin JSON RPC settings
Namecoin will eventually remove the username/password requirements for name_show and other read-only operations.  For
now, the following RPC settings are hardcoded into nmc2Couch.  In the future, I might enable changing host/port but
there is no reason to run nmc2couch against a Namecoind instance with an account balance.

      host: 'localhost',
      port: 8336,
      user: 'user',
      pass: 'pass'


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


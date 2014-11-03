nmc2couch
=========

nmc2couch scrapes valid, non-expired Namecoin names blockchain into CouchDB.  It also has a script for CouchDB which
filters invalid domain records.

#Warning
I made a few errors in my assumptions of the CouchDB data model so I had to hack a solution together.  The codebase now
needs a major refactoring but here is the short version:

* nmc2couch pushes full Namecoin records into a database named 'namecoin' .
* nmc2speech pushes transformed versions of Namecoin records which pass various checks into a database named 'speech'.

Both should just work if you use them.

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

1. Create a namecoin database in your CouchDB install.
2. Run `node nmc2couch.js --verify --debug` to init the database with all current domains.
3. Couch your CouchDB install to ensure that all of the domains were copied over (there should be >100,000).
4. Add the following cron job:

`10	*	*	*	*	nodejs /home/ubuntu/nmc2couch/src/nmc2couch.js`

This cron job will check the past 100 blocks every 10 minutes.  As a new block should be found ~10 minutes, this should
ensure that your database is within one or two blocks of the current blockchain length.  100 blocks are checked in case 
your client was on a chain which was discarded.  100 blocks is total overkill and can be trimmed down if you are on a
very slow machine.

### Authorization
Namecoin and CouchDB should be run on an isolated instance with http and RPC access restricted to local network
connections only.  CouchDB should perform a one-way replication to another CouchDB install running on a local instance
 which itself is accessible from the outside.

Currently, the security of the nmc2couch relies on isolation alone but username/password functionality will be
re-enabled as soon as I have time to refactor the code.  However, even when proper role-based access restrictions are in
 place, isolation of the nmc2couch instance should be maintained.

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
world writable and it pushes everything into a DB called 'namecoin'.

<del>You can manually specify those via a couchdb-settings.json file.

1. `cp couchdb-settings-example.json couchdb-settings.json`
2. Fill in config information in `couchdb-settings.json`

or just use this one-liner while in the project directory:

````
echo '{
  "dbname": "namecoin",
  "user"  : "YOUR COUCHDB USERNAME",
  "pass"  : "YOUR COUCHDB PASSWORD",
  "https" : false,
  "port"  : "5984",
  "uri"   : "127.0.0.1"
 }
' > couchdb-settings.json
````
</del>

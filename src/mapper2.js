'use strict';

function emit(key, value) {
  return {"key": key, "value": value};
}

var goodDocs = [
  {
    "_id": "1/u",
    "_rev": "1-a8f1604199c4d7dda4135b9a079170a3",
    "name": "u",
    "value": {
      "ns": [
      ],
      "translate": "BM-2cUGUhs5CjisRiuQGVWDG3JQJGqzYgq145."
    },
    "expires": 212322,
    "namespace": "1"
  },
  {
    "_id": "d/1053",
    "_rev": "1-ee07c07fe18b2e061af69b2c11fab90d",
    "name": "1053",
    "value": {
      "ip": "",
      "map": {
        "*": {
          "ip": ""
        }
      }
    },
    "expires": 194924,
    "namespace": "d"
  },
  {
    "_id": "bit.co.in/mike.drk",
    "_rev": "1-f83e6cc1e9228c2221594b93cda121e3",
    "name": "mike.drk",
    "value": {
      "pmt_addr": "XvWdM8AVbrxyBqjycGrekMbCakEnVqLBBy"
    },
    "expires": 208206,
    "namespace": "bit.co.in"
  },
  {
    "_id": "bj/y",
    "_rev": "1-1518d0c0d5bbdf60c89480e7e97db49a",
    "name": "y",
    "value": {
    },
    "expires": 204983,
    "namespace": "bj"
  },
  {
    "_id": "bro/one_3",
    "_rev": "1-9a352dcc5b450359c939745f244f257f",
    "name": "one_3",
    "value": "e letters of friendship coming from a brilliant mind. Their\r\npublication can only help to lift the veil a little from a life that\r\nwas as true and good in private as it was noble in public.\r\n\r\n    S. H. M. BYERS.\r\n\r\nST. HELENS, DES MOINES.\r\n\r\n\r\n\r\n\r\nCONTENTS.\r\n\r\n\r\n  CHAPTER I.\r\n\r\n  1869.                                                        PAGE.\r\n\r\n  A Little White Card with President Grantâs Name on It--A\r\n    Voyage to Europe--An English Inn--Hear Gladstone Speak--\r\n    John Bright and Disraeli.                                     15\r\n\r\n\r\n  CHAPTER II.\r\n\r\n  1869.\r\n\r\n  In Switzerland--The Alps--Embarrassment in Not Knowing\r\n    the Language--Celebrated Exiles Meet in a Certain CafÃ©--\r\n    Brentano--Wagner--Kinkel--Scherr--Keller and Others.          20\r\n\r\n\r\n  CHAPTER III.\r\n\r\n  1870.\r\n\r\n  In the Orsini CafÃ©--Great News from France--What the Exiles\r\n    Think--Letter from General Sherman--I Get Permission to Go\r\n    and Look at the War--In the Snow of the Juras--Arrested--\r\n    The",
    "expires": 184636,
    "namespace": "bro",
    "error": true
  },
  {
    "_id": " d/ip-192",
    "_rev": "1-9610dee455eb2ce5c4517dd21da28776",
    "name": "ip-192",
    "namespace": "d",
    "value": {"ip": "192.168.1.1"},
    "expires": 192749
  },
  {
    "_id": " d/ip-google",
    "_rev": "1-9610dee455eb2ce5c4517dd21da28776",
    "name": "ip-google",
    "namespace": "d",
    "value": {"ip": "google.com"},
    "expires": 192749
  },
  {
    "_id": "d/map-localhost",
    "_rev": "1-e7bab0c7584490d1737dc052880f0f4f",
    "name": "map-localhost",
    "value": {
      "map": {
        "": "localhost"
      }
    },
    "expires": 211054,
    "namespace": "d"
  },
  {
    "_id": "d/map-bm",
    "_rev": "1-e7bab0c7584490d1737dc052880f0f4f",
    "name": "map-bm",
    "value": {
      "map": {
        "": "BM-2cUGUhs5CjisRiuQGVWDG3JQJGqzYgq145"
      }
    },
    "expires": 211054,
    "namespace": "d"
  },
  {
    "_id": "d/map-email",
    "_rev": "1-e7bab0c7584490d1737dc052880f0f4f",
    "name": "map-email",
    "value": {
      "map": {
        "": "yasser.khezri@gmail.com"
      }
    },
    "expires": 211054,
    "namespace": "d"
  }
];

function map(doc) {

  var testing = (typeof test !== 'undefined');

  var regexes = {
    good: (/^[a-z0-9][a-z0-9.-:]{2}[a-z0-9_.!~*'()#;,?:-@&=+$]|\/*/),
    bad: (/^(0|10|127|192|198|24[0-5]|255).*|^localhost.*|^(::$|::1$|2001:db8:.*)|^\s.*/),
    name: (/^[a-z]$|^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/)
  };

  if (doc) { //for when run in unit test
    if (!doc.error && validName(doc.name) && doc.namespace === 'd') {
      var entry = validEntry(doc.value);
      if (entry !== false) {
        if (!testing) {
          emit(doc.name, {"http": entry});
        } else {
          return emit(doc.name, {"http": entry});
        }

      }
    }
  }

  function validName(name) { //covered
    return  regexes.name.test(name);
  };

  function checkValue(value) { //covered
    return regexes.good.test(value) && !regexes.bad.test(value) && !squatter(value);
  };

  function squatter(value) {  //covered
    return sString(value) || sRegex(value);

    function sString(value) {
      var squatters = [
        "91.250.85.116",
        "73.239.23.14",
        "212.232.51.96"
      ];

      return squatters.some(function (squatter) {
        return value.indexOf(squatter) > -1;
      });
    }

    function sRegex(value) {
      var sRegexes = [
        (/^[a-z0-9_.!~*'()#-;,?@&=+$]*@.*/), //email check
        (/^BM-.*/)
      ];

      return sRegexes.some(function (regex) {
        return regex.test(value);
      });
    }
  };

  function validEntry(entry) {
    var transports = ['http', 'translate', 'map', 'ip'];
    transports.forEach(function (transport) {

      try { //protects against non-existent records ... not sure if needed.

        var checkedValue = false;
        if (entry.hasOwnProperty(transport)) {

          switch (transport) {
            case "http":
            case "ip":
              checkedValue = entry[transport];
              break;
            case "translate":
              checkedValue = entry[transport];
              if (checkedValue.charAt(-1) === '.') { //remove FQDN period
                checkedValue = checkedValue.slice(0, -1);
              }
              break;
            case "map":
              if (entry.map.hasOwnProperty("")) {
                checkedValue = entry.map[""];
              }
              break;
          }
          if(checkedValue !== false && checkValue(checkedValue)){
            return checkedValue;
          }
        }
        } catch (e) {
          console.log(e);
        }
    });
    return false;
  };
}

module.exports.map = map;
module.exports.emit = emit;
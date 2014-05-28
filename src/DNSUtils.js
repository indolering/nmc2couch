'use strict';

var DNSUtils = function() {
  var that = this;
  this.that = that;

  /*
   * good:
   * [a-z0-9:] starts with alpha numeric or ':', all valid IPv4, IPv6, and standard domains
   * [a-z0-9.-:]{3} at least a 4 digit domain name: a.co
   * [a-z0-9_.!~*'()#;,?:-@&=+$\/] everything that encodeURI() leaves alone
   * www.debuggex.com/r/OU81oekUdnhpc0SW
   *
   * bad:
   * (0|10|127|192|198|24[0-5]|255).*|^localhost.*|^(::$|::1$|2001:db8:.*) beginning of reserved addresses
   * .*\s.* whitespace
   * ^$ blank
   * www.debuggex.com/r/FYXwwRwlMYeyk1dB
   *
   * name:
   * ^[a-z] starts with lowercase alpha
   * ( ... )?$ possibly followed by
   * [a-z0-9-]{0,61} ... up to 61 lowercase alphanumeric and dashes ...
   * [a-z0-9] ... capped by at least one lowercase alphanumeric character
   * www.debuggex.com/r/u8QDvPZzWLaTM2Y0
   */

  that.regexes = {
    good: (/^[a-z0-9:][a-z0-9.-:]{3}[a-z0-9_.!~*'()#;,?:-@&=+$\/]*/),
    bad: (/^(0|10|127|192|198|24[0-5]|255).*|^localhost.*|^(::$|::1$|2001:db8:.*)|.*\s.*|^$/),
    name: (/^[a-z]([a-z0-9\-]{0,61}[a-z0-9])?$/)
  };


  that.validName = function (name) { //covered
    return  that.regexes.name.test(name);
  };

  that.checkValue = function (value) { //covered
    return that.regexes.good.test(value) && !that.regexes.bad.test(value) && !that.squatter(value);
  };

  that.squatter = function (value) {  //covered
    return sString(value) || sRegex(value);

    function sString(value) {
      var squatters = [
        "91.250.85.116",
        "73.239.23.14",
        "212.232.51.96",
        "1.0.0.0",
        "1.2.3.4",
        "70.79.76.3",
        "bitcoinbookkeeper.com",
        "garle.se",
        "94.71.158.121",
        "84.122.135.197",
        "69.65.34.10",
        "27.33.60.98",
        "212.187.124.93",
        "164.138.28.170",
        "162.243.56.54"
      ];

      return squatters.some(function (squatter) {
        return value.indexOf(squatter) > -1;
      });
    }

    function sRegex(value) {
      var regexes = [
        (/^[a-z0-9_.!~*'()#-;,?@&=+$]*@.*/), //email check
        (/^BM-.*/)
      ];

      return regexes.some(function (regex) {
        return regex.test(value);
      });
    }
  };

  that.validEntry = function (entry) {
    var transports = ['http', 'translate', 'map', 'ip'];
    for (var i = 0, len = transports.length; i < len; i++) {
      var transport = transports[i];
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
              if (checkedValue.charAt(checkedValue.length - 1) === '.') { //remove FQDN period
                checkedValue = checkedValue.slice(0, -1);
              }
              break;
            case "map":
              if (entry.map.hasOwnProperty("")) {
                checkedValue = entry.map[""];
              }
              break;
          }
          if ((checkedValue !== false) && (that.checkValue(checkedValue))) {
            return checkedValue;
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
    return false;
  };
}

module.exports = DNSUtils;
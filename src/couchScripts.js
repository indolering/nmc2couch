"use strict";

var docs = [
  {
    "_id": " m/silver",
    "_rev": "1-9610dee455eb2ce5c4517dd21da28776",
    "name": " m/silver",
    "value": "'{email:sigurd.namecoin@gmail.com}'",
    "expires": 192749
  }

];

function parse(doc) {
  doc.value = doc.value.trim();

  try {
    if (doc.value.charAt( 0 ) == '{') {
      doc.value = JSON.parse(doc.value);
    }
  } catch (e) {
    doc.error = true;
  } finally {
    emit(doc);
  }
}

function d(doc){
  var regex = /^.*(?=\/)(.*)/;
  var matches = regex.exec(doc.name);
  doc.namespace = matches[0];
  doc.name = matches[1]
  print(/[^.]+/.exec(url)[0].substr(7)); // prints "xxx"
}

function validDomain(domain){
  return /^[a-z]([a-z0-9-]{0,62}[a-z0-9])?$/.test(domain);
}

function filter(){
  var banned = [
    /^(0|10|127|192|198|24[0-5]|255)\..*/,
    /^(::$|::1$|2001:db8:.*)|/,
    /^localhost.*/
  ];
}
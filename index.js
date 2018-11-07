(function(global, factory) {
  if (typeof define === "function" && define.amd) define(factory);
  else if (typeof module === "object") module.exports = factory();
  else global.FontName = factory();
})(this, function() {
  var FontName = {};

  FontName.parse = function(buff) {
    var bin = FontName._bin;
    var data = new Uint8Array(buff);
    var tag = bin.readASCII(data, 0, 4);

    // If the file is a TrueType Collection
    if (tag == "ttcf") {
      var offset = 8;
      var numF = bin.readUint(data, offset);
      offset += 4;
      var fnts = [];
      for (var i = 0; i < numF; i++) {
        var foff = bin.readUint(data, offset);
        offset += 4;
        fnts.push(FontName._readFont(data, foff));
      }
      return fnts;
    } else {
      return [FontName._readFont(data, 0)];
    }
  };

  FontName._readFont = function(data, offset) {
    var bin = FontName._bin;

    offset += 4;
    var numTables = bin.readUshort(data, offset);
    offset += 8;

    for (var i = 0; i < numTables; i++) {
      var tag = bin.readASCII(data, offset, 4);
      offset += 8;
      var toffset = bin.readUint(data, offset);
      offset += 8;
      if (tag === "name") {
        return FontName.name.parse(data, toffset);
      }
    }

    throw new Error('Failed to parse file');
  };

  FontName._bin = {
    readUshort: function(buff, p) {
      return (buff[p] << 8) | buff[p + 1];
    },
    readUint: function(buff, p) {
      var a = FontName._bin.t.uint8;
      a[3] = buff[p];
      a[2] = buff[p + 1];
      a[1] = buff[p + 2];
      a[0] = buff[p + 3];
      return FontName._bin.t.uint32[0];
    },
    readUint64: function(buff, p) {
      return (
        FontName._bin.readUint(buff, p) * (0xffffffff + 1) +
        FontName._bin.readUint(buff, p + 4)
      );
    },
    /**
     * @param {number} l length in Characters (not Bytes)
     */
    readASCII: function(buff, p, l) {
      var s = "";
      for (var i = 0; i < l; i++) {
        s += String.fromCharCode(buff[p + i]);
      }
      return s;
    },
    readUnicode: function(buff, p, l) {
      var s = "";
      for (var i = 0; i < l; i++) {
        var c = (buff[p++] << 8) | buff[p++];
        s += String.fromCharCode(c);
      }
      return s;
    }
  };

  FontName._bin.t = { buff: new ArrayBuffer(8) };
  FontName._bin.t.int8 = new Int8Array(FontName._bin.t.buff);
  FontName._bin.t.uint8 = new Uint8Array(FontName._bin.t.buff);
  FontName._bin.t.int16 = new Int16Array(FontName._bin.t.buff);
  FontName._bin.t.uint16 = new Uint16Array(FontName._bin.t.buff);
  FontName._bin.t.int32 = new Int32Array(FontName._bin.t.buff);
  FontName._bin.t.uint32 = new Uint32Array(FontName._bin.t.buff);

  FontName.name = {};
  FontName.name.parse = function(data, offset) {
    var bin = FontName._bin;
    var obj = {};
    offset += 2;
    var count = bin.readUshort(data, offset);
    offset += 2;
    offset += 2;

    var names = [
      "copyright",
      "fontFamily",
      "fontSubfamily",
      "ID",
      "fullName",
      "version",
      "postScriptName",
      "trademark",
      "manufacturer",
      "designer",
      "description",
      "urlVendor",
      "urlDesigner",
      "licence",
      "licenceURL",
      "---",
      "typoFamilyName",
      "typoSubfamilyName",
      "compatibleFull",
      "sampleText",
      "postScriptCID",
      "wwsFamilyName",
      "wwsSubfamilyName",
      "lightPalette",
      "darkPalette"
    ];

    var offset0 = offset;

    for (var i = 0; i < count; i++) {
      var platformID = bin.readUshort(data, offset);
      offset += 2;
      var encodingID = bin.readUshort(data, offset);
      offset += 2;
      var languageID = bin.readUshort(data, offset);
      offset += 2;
      var nameID = bin.readUshort(data, offset);
      offset += 2;
      var slen = bin.readUshort(data, offset);
      offset += 2;
      var noffset = bin.readUshort(data, offset);
      offset += 2;

      var cname = names[nameID];
      var soff = offset0 + count * 12 + noffset;
      var str;
      if (platformID == 0) {
        str = bin.readUnicode(data, soff, slen / 2);
      } else if (platformID == 3 && encodingID == 0) {
        str = bin.readUnicode(data, soff, slen / 2);
      } else if (encodingID == 0) { 
        str = bin.readASCII(data, soff, slen);
      } else if (encodingID == 1) {
        str = bin.readUnicode(data, soff, slen / 2);
      } else if (encodingID == 3) {
        str = bin.readUnicode(data, soff, slen / 2);
      } else if (platformID == 1) {
        str = bin.readASCII(data, soff, slen);
        console.log("reading unknown MAC encoding " + encodingID + " as ASCII");
      } else {
        throw new Error("unknown encoding " + encodingID + ", platformID: " + platformID);
      }

      var tid = "p" + platformID + "," + languageID.toString(16);
      if (obj[tid] == null) {
        obj[tid] = {};
      }
      obj[tid][cname] = str;
      obj[tid]._lang = languageID;
    }

    for (var p in obj) {
      if (obj[p].postScriptName != null) {
        return obj[p];
      }
    }

    var tname;
    for (var p in obj) {
      tname = p;
      break;
    }
    console.log("returning name table with languageID " + obj[tname]._lang);
    return obj[tname];
  };

  return FontName;
});

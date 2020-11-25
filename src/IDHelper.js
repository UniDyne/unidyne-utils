function rotate(point, rx, ry, n) {
    if (ry !== 0) {
      return;
    }
    if (rx === 1) {
      point.x = n - 1 - point.x;
      point.y = n - 1 - point.y;
    }
    [point.x, point.y] = [point.y, point.x];
  }


module.exports = {

    // RFC-4122
    // v4 UUID
    // TODO: Expand to other UUID types (v3 and v5)
    getUUID: function() {
        const s = [];
        for(var i = 0; i < 36; i++)
            s.push(hexDigits.substr(Math.floor(Math.random()*0x10), 1));
        
        // bits 12-15 of time_high_and_version field = 0010
        s[14] = "4";

        // bits 6-7 of clock_seq_hi_and_reserved = 01
        s[19] = hexDigits.substr((s[19]&0x3)|0x8,1);

        // place dashes
        s[8] = s[13] = s[18] = s[23] = "-";

        return s.join("");
    },

    // Generate NanoID compatible ID
    // github.com/ai/nanoid
    // essentially URL-safe Base64
    getNanoID: function(t = 21) {
        let e = "";
        let r = crypto.getRandomValues(new Uint8Array(t));

        for(; t--; ) {
            let n = 63 & r[t]; // use 6 bits ( could >>2 )
            if(n < 36) e += n.toString(36);
            else if(n < 62) e += (n-26).toString(36).toUpperCase();
            else if(n < 63) e += "_"; // 62
            else e += "-"; // 63
        }

        return e;
    },


    // Hilbert - Used to obfuscate ID
    // Translates to an ID in Hilbert space
    // Adjust pow for larger or smaller numbers
    // 12 is good for about 16 million values
    // salt will be used to xor the id
    getHilbert: function(id, salt = 0, pow = 12) {
        let n = 2 ** pow;
        let point = {
            x: id % n,
            y: (id / n)>>0
        };
        let rx, ry, index = 0;
        for(let s = n/2; s > 0; s = Math.floor(s/2)) {
            rx = (point.x & s) > 0 ? 1 : 0;
            ry = (point.y & s) > 0 ? 1 : 0;
            index += s * s * ((3 * rx) ^ ry);
            rotate(point, rx, ry, n);
        }

        return (index ^ salt);
    },

    decodeHilbert: function(id, salt = 0, pow = 12) {
        let n = 2 ** pow;
        let point = { x:0, y:0 };
        let rx, ry, s;

        id = parseInt(id, 36) ^ salt;

        for(let s = 1, t = id; s < n; s *= 2) {
            rx = 1 & (t/2);
            ry = 1 & (t^rx);
            rotate(point, rx, ry, s);
            point.x += s * rx;
            point.y += s * ry;
            t /= 4;
        }

        return (point.y*n+point.x);
    }
};
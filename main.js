const fs = require("fs");


const hexDigits = "0123456789abcdef";

// RFC4122 - Random UUID
function createUUID() {
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
}


function getFileBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return data.toString('base64');
}


module.exports = {
    Output: require('./src/OutputHelper'),
    Async: require('./src/AsyncHelper'),
    Commmand: require('./src/CommandHelper'),

    File: require('./src/FileHelper'),



    createUUID: createUUID,
    getFileBase64: getFileBase64,


    atob: function(str) {
		return Buffer.from(str, 'base64').toString('utf8');
	},
	
	btoa: function(str) {
		return Buffer.from(str).toString('base64');
	}
};

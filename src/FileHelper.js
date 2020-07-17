const fs = require("fs"),
    crypto = require('crypto');

module.exports = {
    getFileBase64: function (filePath) {
		const data = fs.readFileSync(filePath);
		return data.toString('base64');
	},

    md5: function (str) {
		var hash = crypto.createHash('MD5');
		hash.update(str);
		return hash.digest('hex');
	},
	
	sha256: function (str) {
		var hash = crypto.createHash('SHA256');
		hash.update(str);
		return hash.digest('hex');
	}
};

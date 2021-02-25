const fs = require("fs"),
    crypto = require('crypto');

module.exports = {
	getHash: function(filePath, alg, callback) {
		var hash = crypto.createHash(alg);
		var input = fs.createReadStream(filePath);
		hash.setEncoding('base64');
		input.on('end', function() {
			hash.end();
			input.close();
			callback(hash.read());
		});
		input.pipe(hash);
	},

    getBase64: function (filePath) {
		return (fs.readFileSync(filePath)).toString('base64');
	},

	getJson: function (filePath) {
		return JSON.parse(fs.readFileSync(filePath));
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

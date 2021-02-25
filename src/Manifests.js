// Library for creating and consuming file manifests

const fs = require('fs'),
	path = require('path'),
    crypto = require('crypto'),
    FileHelper = require('./FileHelper');

const ManifestConfig = {
    sign: false,
    //signEntries: false,
    privateKey: null,
    publicKey: null,
    hashAlg: 'sha256',
    ignoreFiles: [
        /^\./,				// hidden files
        /~$/,				// temp text editor
        /^#.*#$/			// temp text editor
    ]
};


// utility method used to consistently produce the same JSON structures
// used for signing manifest
function getCanonicalJSON(obj) {
	if(typeof obj === 'object') {
		var keys = [];
		// get keys and sort them
		for(var k in obj) keys.push(k);
		keys.sort();
		
		// append each kvp to string
		return '{' + keys.reduce(function(prev, cur, i) {
			return prev + (i>0?',':'') + '"' + cur + '":' + getCanonicalJSON(obj[cur]);
		}, '') + '}';
	} else if(typeof obj === 'function') {
		return 'null';
	} else return JSON.stringify(obj);
}



/**
 * Loads a private key from a file.
 * @param {String} pathname - path to private key file
**/
function loadPrivateKey(pathname) {
	ManifestConfig.privateKey = fs.readFileSync(pathname).toString('ascii');
};


/**
 * Loads private key from a file.
 * @param {String} pathname - path to public key (pem file)
**/
function loadPublicKey(pathname) {
	ManifestConfig.publicKey = fs.readFileSync(pathname).toString('ascii');
};


/**
 * Build file hashes from a given directory. Recursively asynchronous.
 * @param {String} pathname
 * @param {Function} callback
**/
function buildHashList(pathname, callback) {
	var files = fs.readdirSync(pathname);
	
	var hashList = [];
	var done = -1;
	
	function nextFile() {
		if(++done == files.length)
			return process.nextTick(function() { callback(hashList) } );
		
		
		var filepath = path.resolve(pathname, files[done]);
		var st = fs.statSync(filepath);
		if(st.isDirectory()) buildHashList(filepath, function(hl) {
			hashList.push({name:files[done], files:hl});
			return process.nextTick(nextFile);
		});
		else if(st.isFile() && st.size > 0) {
			if(ManifestConfig.ignoreFiles.reduce(function(previous, current) {
				return previous || current.test(files[done]);
			}, false)) return process.nextTick(nextFile);
			
			FileHelper.getHash(filepath, function(h) {
				var entry = {name:files[done], size:st.size, hash:h};
                
                /*
				if(ManifestConfig.signEntries) {
					var sign = crypto.createSign('RSA-SHA256');
					sign.update(files[done]+":"+st.size+":"+h);
					entry.sig = sign.sign(module.exports.config.privateKey, 'base64');
                }
                */
				
				hashList.push(entry);
				return process.nextTick(nextFile);
			});
		} else process.nextTick(nextFile);
		
	}
	
	/* this is async */
	process.nextTick(nextFile);
};

/**
 * Create manifest file for a given directory.
 * @param {String} outfile
 * @param {String} pathname
 * @param {Function} callback - optional
**/
function createManifest(outfile, pathname, callback) {
	buildHashList(pathname, function(hashList) {
			writeManifest(outfile, pathname, hashList, callback);
	});
};

/**
 * Write manifest file for given hashList. Used by createManifest.
 * Also used by command-line utility.
 * @param {String} outfile
 * @param {String} pathname
 * @param {HashList} hashList
**/
function writeManifest(outfile, pathname, hashList) {
	var sig = null;
	if(ManifestConfig.sign) {
		var sign = crypto.createSign('RSA-SHA256');
		sign.update(getCanonicalJSON(hashList));
		sig = sign.sign(module.exports.config.privateKey, 'base64');
	}
	
	fs.writeFileSync(outfile, JSON.stringify({
		name: pathname,
		version: '1.0',
		sig: sig,
		dist: hashList
	}), "utf8");
}


/**
 * Check manifest signature.
 * @param {Manifest} mf
**/
function checkSignature(mf) {
	if(!mf.hasOwnProperty('sig') || !mf.hasOwnProperty('dist') || mf.sig == null) return false;
	
	var verify = crypto.createVerify('RSA-SHA256');
	verify.update(getCanonicalJSON(mf.dist));
	return verify.verify(module.exports.config.publicKey, mf.sig, 'base64');
};


/**
 * Compare manifest segments.
 * @param {} sChunk Saved manifest chunk.
 * @param {} lChunk Live manifest chunk.
 **/
function compareFiles(sChunk, lChunk) {
 	 
    // create index
  var files = {}, dirs = {};
  for(var i = 0; i < sChunk.length; i++) {
      if(sChunk[i].hasOwnProperty('hash')) files[sChunk[i].name] = i;
      else if(sChunk[i].hasOwnProperty('files')) dirs[sChunk[i].name] = i;
      else sChunk.splice(i, 1); // bad data
  }
  
  for(var i = lChunk.length - 1; i >= 0; i--) {
      if(lChunk[i].hasOwnProperty('hash')) {
          if(files.hasOwnProperty(lChunk[i].name)) {
              var j = files[lChunk[i].name];
              // match
              if(sChunk[j].size == lChunk[i].size && sChunk[j].hash == lChunk[i].hash) {
                  //App.log("Match "+lChunk[i].name);
                  delete files[lChunk[i].name];
                  lChunk.splice(i,1);
                  sChunk.splice(j,1);
              } else {
                  // delete from local side
                  lChunk.splice(i,1);
              }
          }
      } else if(lChunk[i].hasOwnProperty('files')) {
          if(dirs.hasOwnProperty(lChunk[i].name)) {
              var j = dirs[lChunk[i].name];
              compareFiles(sChunk[j].files, lChunk[i].files);
              
              if(sChunk[j].files.length == 0) sChunk.splice(j,1);
              if(lChunk[i].files.length == 0) lChunk.splice(i,1);
          }
      } else lChunk.splice(i, 1); // bad data
  }
  
  return { saved: sChunk, live: lChunk };
};


module.exports = {
    buildHashList: buildHashList,
	checkSignature: checkSignature,
	compareFiles: compareFiles,
	createManifest: createManifest,

    loadPrivateKey: loadPrivateKey,
    loadPublicKey: loadPublicKey,
    
    config: ManifestConfig
};

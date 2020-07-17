// eventually, this needs to validate command line args
// optionally, print "usage" output


function parseArgV() {
    return parseArgs(process.argv.slice(2));
}

function parseArgs(args) {
    const params = { unnamed: [] };

    args.forEach((val, idx) => {
        // starts with / or - or --
        if((/^\/|-+/).test(val)) {
            var kv = val.replace(/^\/|-+/,'').split(/:|=/);
            if(kv.length == 1) {
                params[[kv[0]] = true;
            } else params[kv[0]] = kv[1];
        } else {
            params.unnamed.push(val);
        }
    });
    
    return params;
}

module.exports = {
    parseArgV: parseArgV,
    parseArgs: parseArgs
};


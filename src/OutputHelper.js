const fs = require("fs"),
    path = require("path"),
    process = require("process");



// Adapted from:
// https://stackoverflow.com/questions/16697791/nodejs-get-filename-of-caller-function/29581862
function getCallingModule() {
    // save original function
    const original = Error.prepareStackTrace;

    var callingModule;
    try {
        var err = new Error();
        var current;

        // override prepareStackTrace
        Error.prepareStackTrace = function(err, stack) { return stack; };

        // unwind stack and stop when file name changes
        current = err.stack.shift().getFileName();
        while(err.stack.length > 0 && callingModule == current)
            callingModule = err.stack.shift().getFileName();
        callingModule = path.basename(callingModule, '.js');
    } catch(e){}

    // put original function back
    Error.prepareStackTrace = original;
    return callingModule;
}


function mkDateCode(wtime) {
    const d = new Date();
    const code = ''+d.getFullYear()+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2);
    return wtime?code+('0'+d.getHours()).slice(-2)+('0'+d.getMinutes()).slice(-2):code;
}


// need to create a log file
// timestamp / module / level / message / data
// THIS IS NOT SAFE FOR CLUSTER OR FORK
// add functionality to use a PID?
// hook process exit to close the file?
function logToFile(level, message, data) {
    const logData = [
        new Date().toISOString(),
        getCallingModule(),
        level,
        message,
        JSON.stringify(data)
    ];
    const logFile = path.join(process.cwd(), 'log', `${path.basename(process.argv[1], '.js')}_${mkDateCode(false)}.log`);

    // append
    const out = fs.createWriteStream(logfile, {flags:'a+'});
    out.write(`${logData.join('\t')}\n`);
    out.close();
}


// hook process for uncaught exceptions
function activateDebugHook() {
    process.on('uncaughtException', function(err) {
        if(typeof err == 'string')
            return module.exports.debug(err);
        if(err.hasOwnProperty('message'))
            return module.exports.debug(err.message, err);
        return module.exports.debug('Unknown', err);

        // add process termination on hang??
    });
}


module.exports = {
    status: function(message) {
        console.log(`\x1b[36m${message}\x1b[0m`);
    },

    info: function(message) {
        console.info(`\x09${message}`);
    },

    croak: function(message, data) {
        console.error(`\x1b[1;41;5m${message}\x1b[0m`);
        logToFile('CROAK', message, data);
    },

    error: function(message, data) {
        console.error(`\x1b[31m${message}\x1b[0m`);
        logToFile('ERROR', message, data);
    },

    warn: function(message, data) {
        console.error(`\x1b[33m${message}\x1b[0m`);
        logToFile('WARN', message, data);
    },

    debug: function(message, data) {
        console.log(`\x09\x1b[35m${message}\x1b[0m`);
        logToFile('DEBUG', message, data);
    },


    
    activateDebugHook: activateDebugHook
};

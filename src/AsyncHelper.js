const fs = require("fs");


function asleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function sleep(ms) { await asleep(ms); }

function aFileCopy(source, dest) {
    return new Promise(resolve => {
        fs.createReadStream(source).pipe(fs.createWriteStream(dest)).on('finish', resolve);
    });
}

async function aForEach(data, fn, ignoreExceptions=true) {
    const queue = [];
    for(var i = 0; i < data.length; i++) {
        var current = data[i];
        queue.push(new Promise(async (resolve, reject) => {
            try {
                await fn(current);
            } catch(e) { if(!ignoreExceptions) return reject(e, current); /*else handleError(e, current);*/ }
            return resolve();
        }));
    }
    await Promise.all(queue);
}

module.exports = {
    asleep: asleep,
    sleep: sleep,

    asyncFileCopy: aFileCopy,
    asyncForEach: aForEach
};

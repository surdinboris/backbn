
//////////////creating server
const {createServer} = require("http");
const methods = Object.create(null);

createServer((request, response) => {
    let handler = methods[request.method] || notAllowed;
handler(request)
    .catch(error => {

    if (error.status != null) return error;

return {body: String(error), status: 500};
})
///////{body, status = 200, type = "text/plain"} ---unpackingwith fallbacks  for object returned from handler
.then(({body, status = 200, type = "text/html"}) => {
response.writeHead(status, {"Content-Type": type});
if (body && body.pipe) body.pipe(response);
else response.end(body);
});
}).listen(5000);

async function notAllowed(request) {
    return {
        //status: 405,
        body: `Method ${request.method} not allowed.`
    };
}

//url decoding and path verifying
const {parse} = require("url");
const {resolve, sep} = require("path");

const baseDirectory = process.cwd();

function toFSpath(url) {
    let {pathname} = parse(url);
    let path = resolve(decodeURIComponent(pathname).slice(1));
    console.log('path',path)
    if (path != baseDirectory &&
        !path.startsWith(baseDirectory + sep)) {
        throw {status: 403, body: "Forbidden"};
    }
    return path;

}

///GET handler for retrieving data

const {createReadStream} = require("fs");
const {stat, readdir} = require("fs").promises;
const mime = require("mime");

methods.GET = async function(request) {
    let path = toFSpath(request.url);
    //console.log('toFSpath',request.url,toFSpath(request.url))
    let stats;
    try {
        stats = await stat(path);
    } catch (error) {
        console.log(error);
        if (error.code != "ENOENT") throw error;
        else return {status: 404, body: "File not found"};
    }
    if (stats.isDirectory()) {
        let urllist=(await readdir(path)).map((c)=>{
            return `<a href=${request.url}${c}>${c}</a><br>`});

    return {body: urllist.join("\n")};
}
    else {
        return {body: createReadStream(path),
            type: mime.getType(path)};
    }
};

const {rmdir,mkdir, unlink} = require("fs").promises;

methods.DELETE = async function(request) {
    let path = toFSpath(request.url);
    let stats;
    try {
        stats = await stat(path);
    } catch (error) {
        if (error.code != "ENOENT") throw error;
        else return {status: 204};
    }
    if (stats.isDirectory()) await rmdir(path);
else await unlink(path);
    return {status: 204};
};

const {createWriteStream} = require("fs");

function pipeStream(from, to) {
    return new Promise((resolve, reject) => {
        from.on("error", reject);
    to.on("error", reject);
    to.on("finish", resolve);
    from.pipe(to);
});
}
//
// methods.PUT = async function(request) {
//     let path = toFSpath(request.url);
//     await pipeStream(request, createWriteStream(path));
//     return {status: 204};
// };
//
// methods.MKCOL  = async function(request) {
//     let path = toFSpath(request.url);
//     console.log(path);
//     try {
//         await mkdir(path);
//     } catch (error) {
//         if (error) {
//             return {status: 404, body: "Directory already present"}}
//     }
//     return {status: 200, body: "Directory created sucessfully"};
// };
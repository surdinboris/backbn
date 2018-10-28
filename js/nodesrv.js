
//////////////creating server
const {createServer} = require("http");
const methods = Object.create(null);
const RESTmethods = Object.create(null);
const {parse} = require("url");
const {resolve, sep} = require("path");
const baseDirectory = process.cwd();
const {rmdir,mkdir, unlink} = require("fs").promises;
const {createWriteStream} = require("fs");
const {createReadStream} = require("fs");
const {stat, readdir} = require("fs").promises;
const mime = require("mime");

//fake DB
let pseudoDB = [ {id:0, nettitle: 'data from node server one',
    meta: 800}
    ,{id:1, nettitle: 'data from node server two',
    meta: 800},{id:2, nettitle: 'data from node server three',
    meta: 800}];

function isRestURL(request){
    let idfilter = /\/restapi\/?(\d+)?$/;
    let result=idfilter.exec(request);
    if(result && result[1]) {
        return result[1]
    }
    return result
}

function updateDB(rec) {
    let updId=rec.id;
    let index= -1;
    pseudoDB.forEach(rec=>{
      if(rec.id == updId){
          index=pseudoDB.indexOf(rec)
      }
    });
    if(index > -1){
        pseudoDB.splice(index,1,rec);
       // pseudoDB.push(rec);
        console.log('pseudoDB updated', pseudoDB)
    }
}
//helpers
async function notAllowed(request) {
    return {
        //status: 405,
        body: `Method ${request.method} not allowed.`
    };
}

//url decoding and path verifying
function toFSpath(url) {
    let {pathname} = parse(url);
    let path = resolve(decodeURIComponent(pathname).slice(1));

    if (path != baseDirectory &&
        !path.startsWith(baseDirectory + sep)) {
        throw {status: 403, body: "Forbidden"};
    }
    return path;

}

function pipeStream(from, to) {
    return new Promise((resolve, reject) => {
        from.on("error", reject);
        to.on("error", reject);
        to.on("finish", resolve);
        from.pipe(to);
    });
}
// accept urls in format '/restapi' or '/restapi/2' test:
//console.log(isRestURL('/restapi'))
//console.log(isRestURL('/restapi/2'))


createServer((request, response) => {
    //Router - checking whatever its a regular request or rest api
    console.log('node got',request.url, request.method)
    let handler = methods[request.method] || notAllowed;

    if (isRestURL(request.url)) {
        handler = RESTmethods[request.method] || notAllowed;
    }

    //handle request with appropriate method
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


///GET handler from REST url - without htm building things
RESTmethods.GET = async function(request) {
    console.log('RESTmethods.GET gett', request.url);

    return {
        status: 200, body: JSON.stringify(pseudoDB)
    }

};
RESTmethods.PUT = async function(request) {
    var responseString = "";
    request.on("data", function (data) {
        responseString += data;
    });
    request.on("end", function () {
        //console.log(JSON.parse(responseString));
        //appending to model
        updateDB(JSON.parse(responseString));
    });

    return  {
        status: 200, body: 'ok'
    }
};

RESTmethods.PATCH = async function (request) {
    var responseString = "";
    request.on("data", function (data) {
        responseString += data;
    });
    request.on("end", function () {
        console.log(JSON.parse(responseString));
        //appending to model
        //updateDB(JSON.parse(responseString));
    });
    return {
        status: 200, body: 'ok'   }
    };

RESTmethods.DELETE = async function(request) {
    console.log('RESTmethods.DELETE delete', request.url);
    let id = isRestURL(request.url);
    let index = -1;
    pseudoDB.forEach(record=> {
    if(record.id == id){
        index= pseudoDB.indexOf(record)
    }});
    if(index > -1){
         pseudoDB.splice(index,1)
    }
        console.log(pseudoDB)
    return {
        status: 200, body: 'ok'
    }

};

///GET handler
methods.GET = async function(request) {

    let path = toFSpath(request.url);

    //console.log('toFSpath',request.url,toFSpath(request.url))
    let stats;
    try {
        stats = await stat(path);
    } catch (error) {
        //console.log(error);
        if (error.code != "ENOENT") throw error;
        else return {status: 404, body: "File not found"};
    }
    if (stats.isDirectory()) {
        //console.log(request.url);
        //fullpath to enter to  subsub levels
        let urllist = (await readdir(path)).map((c) => {
            //patch - avoid unnecessary '/' addidtions
            if(request.url == "/"){
                return `<a href=${c}>${c}</a><br>`
            }
            return `<a href=${request.url+"/"+c}>${c}</a><br>`
        });

        return {body: urllist.join("\n")}
    }
    else {
        return {body: createReadStream(path),
            type: mime.getType(path)};
    }
};


// methods.DELETE = async function(request) {
//     let path = toFSpath(request.url);
//     let stats;
//     try {
//         stats = await stat(path);
//     } catch (error) {
//         if (error.code != "ENOENT") throw error;
//         else return {status: 204};
//     }
//     if (stats.isDirectory()) await rmdir(path);
// else await unlink(path);
//     return {status: 204};
// };
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
//creating server
const {createServer} = require("http");
const methods = Object.create(null);
const RESTmethods = Object.create(null);
const {parse} = require("url");
const {resolve, sep} = require("path");
const baseDirectory = process.cwd();
const {rmdir, mkdir, unlink} = require("fs").promises;
const {createWriteStream} = require("fs");
const {createReadStream} = require("fs");
const {stat, readdir} = require("fs").promises;
const mime = require("mime");
const mongoose = require('mongoose');

////DB - to be wrapped in  module with CRUD interface

let mongoDB = 'mongodb://127.0.0.1:27017/todos';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
let Schema = mongoose.Schema;
let TodoSchema = new Schema({
    title: '',
    meta: 0,
    completed: false,
    todoDate: 0
});
let TodoModel = mongoose.model('SomeModel', TodoSchema);
//long polling
let ETag = 1;
let waiting = [];

function updatever() {
    ETag++;
    console.log('etag was updated', ETag);
    waiting.forEach(resolve => resolve(getAllDB()));
    waiting = []
}

//testing
(function populateDB() {
    for (let i = 1; i < 52; i++) {
        addDB({

            title: `data from node server four ${i}`,
            meta: 800,
            completed: i % 2 == 0,
            todoDate: 0
        }, false).then(res => console.log(res._id)).catch(err => console.log('failed to get added id\'s due to adding errors', err))

    }
});

//get all records

function getAllDB() {
    return new Promise(function (resolve, reject) {
        TodoModel.find({}, function (err, res) {
            resolve(res)
        })
    })
}

//testing
//getAllDB().then(console.log)

//getDB record by id - helper (promise wrapped)
function getById(_id) {
    return new Promise(function (resolve, reject) {
        TodoModel.find({_id: _id}, function (err, res) {
            if (err) {
                reject(err);
                return
            }
            if (res.length > 1) {
                reject(`there is more than one document found with similar id found \n,${res}`);
                return
            }
            if (res.length == 0) {
                resolve(false)
            }
            resolve(res[0])
        })
    })

}

// testing
//getDB(3).then(console.log)

//adding\updating with validation
function addDB(record, update) {
    //maybe add some validation of arrived data record?
    return new Promise(function (resolve, reject) {
        //retrieving dbrecord  from the database if presented
        getById(record._id).catch(err => console.log('new record\'s id failed to be verified in database before saving with following error (escalated): \n', err))
            .then(function (dbrecord) {
                let newrec = new TodoModel(record);
                //not suitable case - avoid to updates for not presented record

                if (!dbrecord && update) {
                    reject(' error: updates for not presented record not allowed')
                    return
                }
                //in case of id was found but update not allowed(adding new record case)
                if (dbrecord && !update) {
                    console.log('dbrecord', dbrecord);
                    reject('trying to add record with id that persists in database')
                    return
                }
                //in case of updating new record - replacing content of persisted data
                if (dbrecord && update) {
                    newrec = dbrecord.set(record)
                }
                //in case of id not found in db - just creation of new record

                newrec.save(function (savingerr, record) {
                    if (savingerr) {
                        reject(savingerr)
                    }
                    updatever();
                    resolve(record)
                })
            })
    }).catch(err => console.log('addDB error: \n', err))
}


// getById(23).then(res => {console.log('promised',res)
// }).catch(err => console.log(err));
//remove
function removeDB(record) {
    return new Promise(function (resolve, reject) {
        TodoModel.deleteOne(record, function (err, result) {
            if (err) {
                reject('DB error occured', err);
                return
            }
            if (result.n == 0) {
                reject('no records were deleted');
                return
            }
            resolve(result)
        })
    })
}

//removeDB({title: 'data from node server four 23'})
// removeDB({title: 'data from node server four 23'})
//     .then(res =>console.log(res))
//     .catch(err => console.log(err));

function isRestURL(requestUrl) {
    let idfilter = /\/restapi\/?(\w+)?$/;
    return idfilter.exec(requestUrl)
}


//response
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

//long polling support
function waitForChanges(time) {
    return new Promise(resolve => {
        waiting.push(resolve);
        console.log('waiting updated>>>', waiting)
        setTimeout(() => {
            if (!waiting.includes(resolve)) {
                console.log('waiting not includes')
                return
            }
            //in case of waiting includes passed in resolve
            //that means that it already waited enough so
            // clearing from this resolve from waiting
            waiting = waiting.filter(r => r != resolve);
            //and resolving it
            resolve({status: 304});
        }, time * 1000);
    });
};

createServer((request, response) => {
    //Router - checking whatever its a regular request or rest api
    console.log('request.method', request.method)
    let handler = methods[request.method] || notAllowed;
    if (isRestURL(request.url)) {
        handler = RESTmethods[request.method] || notAllowed;
    }


    //handle request with appropriate method
    // else {
    handler(request)
        .catch(error => {
            if (error.status != null) return error;
            return {status: 500, body: String(error)};
        })
        ///////{body, status = 200, type = "text/plain"} ---unpackingwith fallbacks  for object returned from handler
        .then(({status = 200, body, type = "text/html", ETag = 0}) => {
            response.writeHead(status, {"Content-Type": type, "ETag": ETag});

            if (body && body.pipe) {

                body.pipe(response)
            }
            else response.end(body);
        });
    //  }


}).listen(5000);

async function DbResponse(request) {
    console.log('dbresponse activated', request.url);
    let id;
    let resp;

    if (request) {
        id = isRestURL(request.url)[1];
    }

    if (id) {
        resp = await getById(id);
    }
    else {
        resp = await getAllDB();
    }
    console.log('dbresp', resp)
    return resp
//         status: 200,body: JSON.stringify(resp),
//         type: "application/json", ETag: ETag
// }
}

RESTmethods.GET = async function (request) {

    let id = isRestURL(request.url)[1];
    console.log('RESTmethods.GET >> ', id || 'no id');
    //in case of rest request
    if (id != 'up') {
        console.log('id != up');
        let resp;
        if (id) {
            resp = await getById(id);
        }
        else resp = await getAllDB();

        return {
            status: 200, body: JSON.stringify(resp), ETag: ETag
        }
    }
    else {
        console.log('id == up')
        let tag = /(.*)/.exec(request.headers["if-none-match"]);
        let wait = /\bwait=(\d+)/.exec(request.headers["prefer"]);

        console.log('if-none-match', request.headers["if-none-match"])

        console.log('wait', wait, "tag", tag);
        if( !tag || tag[1] != ETag) {
            console.log('Returning ETag to initiate or not client-side update (to regular url');

            //blah-blah-blah business logic for waiting + different
            // responses according client configuration

            return {
                status: 200, ETag: ETag
            }
        }

        else if(!wait) {
            return {
                status: 304, ETag: ETag
            }
        }
        else {
            console.log('returning waitForChanges')
            return waitForChanges(Number(wait[1]))
        }
    }
};

// RESTmethods.GET = async function (request) {
//     return new Promise(function (resolve, reject) {
//         let responseString = "";
//         request.on("data", function (data) {
//             responseString += data;
//         });
//         request.on("end", async function () {
//             //in case if polling "update" request
//             if (isRestURL(request.url)[1] == 'up') {
//                 console.log('\'dbresponse sent to request /up" \')\n' +
//                     '------>', JSON.stringify(request.headers));
//
//                 console.log('------>', JSON.stringify(request.headers)["if-none-match"]);
//                 console.log('------>', JSON.stringify(request.headers)["prefer"]);
//
//                 let tag = /"(.*)"/.exec(request.headers["if-none-match"])
//                 //get client client's waiting time
//                 let wait = /\bwait=(\d+)/.exec(request.headers["prefer"]);
//                 //console.log('request->>>>>',request);
//                 console.log('tag', tag);
//                 console.log('wait', wait);
//
//                 // return response to allowing db update in case of
//                 //version tag (request's "if-none-match" header) is not equal server's version (stored and returned as ETag)
//                 if (!tag || tag[1] != ETag) {
//                     console.log('issuing db update in case of version tag unequality tag-etag', tag[1], ETag);
//                     return {
//                         status: 200, body: 'server-side update issued', ETag: ETag
//                     };
//                 }
//
//
//                 //in opposite case and without waiting flag returning 'not changed code'
//                 if (!wait) {
//                     return {status: 304};
//                 }
//                 else {
//
//                     console.log('waiting response')
//                     resolve(waitForChanges(Number(wait[1])));
//
//                 }
//             }
//             /////in case of non polling request
//
//             else{
//                 let resp = await DbResponse(request);
//
//                 return {
//                     status: 200, body: JSON.stringify(resp), ETag: ETag
//                 }
//
//         }
//     })
// })};
//


//in this implementation an updateDB is enough smart
//to decside if update or new item arrived

//create
RESTmethods.POST = function (request) {
    return new Promise(function (resolve, reject) {
        let responseString = "";
        request.on("data", function (data) {
            responseString += data;
        });
        request.on("end", function () {
            console.log('RESTmethods.POST new', JSON.parse(responseString));
            addDB(JSON.parse(responseString), false).then(newRec => {
                resolve({
                    status: 200, body: JSON.stringify(newRec)
                });
            })
        })
    })
};
RESTmethods.PUT = function (request) {
    return new Promise(function (resolve, reject) {
        let responseString = "";
        request.on("data", function (data) {
            responseString += data;
        });
        request.on("end", function () {
            console.log('RESTmethods.PUT update', JSON.parse(responseString));
            addDB(JSON.parse(responseString), true).then(newRec => {
                resolve({
                    status: 200, body: JSON.stringify(newRec)
                });
            })
        })
    })
};

//deleting data from db based on /restapi/id request
RESTmethods.DELETE = function (request) {
    let requestId = {_id: isRestURL(request.url)[1]};
    console.log('RESTmethods.DELETE delete', requestId);
    return new Promise(function (resolve, reject) {
        let responseString = "";
        request.on("data", function (data) {
            responseString += data;
        });
        request.on("end", function () {
            removeDB(requestId, false).then(newRec => {
                resolve({
                    status: 200, body: "ok"
                });
            })
        })
    })
};

///GET handler
methods.GET = async function (request) {
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
            if (request.url == "/") {
                return `<a href=${c}>${c}</a><br>`
            }
            return `<a href=${request.url + "/" + c}>${c}</a><br>`
        });

        return {body: urllist.join("\n")}
    }
    else {
        return {
            body: createReadStream(path),
            type: mime.getType(path)
        };
    }
};


//fake DB
// let pseudoDB = [{
//     id: 0,
//     title: 'data from node server one',
//     meta: 800,
//     completed: true,
//     todoDate:0
// },
//     {
//         id: 1,
//         title: 'data from node server two',
//         meta: 800,
//         completed: true,
//         todoDate:0
//     },
//     {
//         id: 2,
//         title: 'data from node server three',
//         meta: 80,
//         completed: false,
//         todoDate:0
//
//     }];

//
// if(methods[request.method] == 'POST' || 'post'){
//         console.log('async handler executed');
//     handler(request).then(resconsole.log)
// }

//to be rewritten!!!!!!!!!
// RESTmethods.DELETE = async function(request) {
//     console.log('RESTmethods.DELETE delete', request.url);
//     let id = isRestURL(request.url);
//     let index = -1;
//     pseudoDB.forEach(record=> {
//         if(record.id == id){
//             index= pseudoDB.indexOf(record)
//         }});
//     if(index > -1){
//         pseudoDB.splice(index,1)
//     }
//     console.log(pseudoDB)
//     return {
//         status: 200, body: 'ok'
//     }
//
// };

// accept urls in format '/restapi' or '/restapi/:2' test:
//console.log(isRestURL('/restapi'))
//console.log(isRestURL('/restapi/2'))
//for info - from backbone's rest api
// url             HTTP Method  Operation
// /api/books      GET          Get an array of all books
// /api/books/:id  GET          Get the book with id of :id
// /api/books      POST         Add a new book and return the book with an id attribute added
// /api/books/:id  PUT          Update the book with id of :id
// /api/books/:id  DELETE       Delete the book with id of :id

// function addId(data) {
//     const mp = {};
//     Object.keys(data).forEach ((k) =>  { mp[k]= data[k]});
//     if(mp._id)
//         mp.id=mp._id;
//     console.log(data);
//     return JSON.stringify(mp);
// }
///GET handler from REST url - without htm building things

//helpers
//helper for upd database
// function updateDB(rec) {
//     if(!rec.id){
//         console.log('arrived data without id', rec)
//         return
//     }
//     let index= -1;
//     pseudoDB.forEach(r=>{
//         if(r.id == rec.id){
//             index=pseudoDB.indexOf(r)
//         }
//     });
//     if(index > -1){
//         pseudoDB.splice(index,1,rec);
//         // pseudoDB.push(rec);
//         console.log('pseudoDB record updated', pseudoDB)
//     }
//     else {
//
//         pseudoDB.push(rec);
//         console.log('pseudoDB record appended', pseudoDB);
//     }
// }

//trash
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




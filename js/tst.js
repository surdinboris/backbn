SkillShareServer.prototype.talkResponse = function() {
    let talks = [];
    for (let title of Object.keys(this.talks)) {
        talks.push(this.talks[title]);
    }
    return {
        body: JSON.stringify(talks),
        headers: {"Content-Type": "application/json",
            "ETag": `"${this.version}"`}
    };
};

router.add("GET", /^\/talks$/, async (server, request) => {
    let tag = /"(.*)"/.exec(request.headers["if-none-match"]);
    let wait = /\bwait=(\d+)/.exec(request.headers["prefer"]);
    if (!tag || tag[1] != server.version) {
        return server.talkResponse();
    } else if (!wait) {
        return {status: 304};
    } else {
        return server.waitForChanges(Number(wait[1]));
    }
});

SkillShareServer.prototype.updated = function() {
    this.version++;
    let response = this.talkResponse();
    this.waiting.forEach(resolve => resolve(response));
    this.waiting = [];
};


//client

function fetchOK(url, options) {
    return fetch(url, options).then(response => {
        if (response.status < 400) return response;
        else throw new Error(response.statusText);
    });
}

async function pollTalks(update) {
    let tag = undefined;
    for (;;) {
        let response;
        try {
            response = await fetchOK("/talks", {
                headers: tag && {"If-None-Match": tag,
                    "Prefer": "wait=90"}
            });
        } catch (e) {
            console.log("Request failed: " + e);
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
        }
        if (response.status == 304) continue;
        tag = response.headers.get("ETag");
        update(await response.json());
    }
}

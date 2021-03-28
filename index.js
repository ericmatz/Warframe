const fetch = require('node-fetch');
const Database = require('sqlite-async');
const db_utility = require('./db_source');

var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(3, 'second');

function getData(url) {
    return new Promise((resolve, reject) => {
        try {
            fetch(url)
                .then(res => res.json())
                .then(res => resolve(res))
                .catch(err => { throw err })
        } catch {
            reject('caught itbb')
        }
    })
}

function updateMod(db, id, data) {
    return new Promise((resolve,reject) =>{
        let current_data = Array.from(Array.from(data.payload.statistics_live['48hours']), x => JSON.parse(JSON.stringify(
            {
                'avg_price': x.avg_price,
                'mod_rank': x.mod_rank,
                'timestmap': x.datetime
            }
        )));

        current_data.sort(function (a, b) { return a.timestmap - b.timestmap })

        if (current_data[0].mod_rank == current_data[1].mod_rank || current_data[0].timestamp != current_data[1].timestamp) {
            reject(`Mod Rank are the same or datetime mismatch`);
        }

        let data_set = {
            "id": id,
            "price_min": (current_data[0].mod_rank < current_data[1].mod_rank
                ? current_data[0].avg_price
                : current_data[1].avg_price),
            "price_max": (current_data[0].mod_rank > current_data[1].mod_rank
                ? current_data[0].avg_price
                : current_data[1].avg_price),
            "last_update": Date.now()
        }
        console.log(data_set)
        db.run(db_utility.mod_update , data_set.last_update,data_set.price_min, data_set.price_max, data_set.id)
        .then(resolve(`Success: ${id}`))
        .catch(err => reject(err))
    })
}

try {
    Database.open('./db/warframe.db', Database.OPEN_READWRITE)
        .then(db => {
            console.log(db)
            db.run(db_utility.mods_table)
                .then(() => {
                    db.all(db_utility.mod_select)
                        .then(rows => {
                            rows.forEach(async (row) => {
                                console.log(`Sending get datarequest for ${row.id}`)

                                limiter.removeTokens(1, function () {
                                    getData(row.url)
                                        .then(res => {
                                            updateMod(db, row.id, res)
                                                .then(res => console.log(`Mod: ${row.id} updated! message: ${res}`))
                                                .catch(err => { throw err })
                                        })
                                        .catch(err => { throw err })
                                });
                            });
                        })
                        .catch(err => { throw err })
                })
                .catch(err => { throw err })
        })
        .catch(err => { throw err; })
} catch {
    console.log('caught it?')
}
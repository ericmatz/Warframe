const fetch = require("node-fetch");
const db_utility = require("./db_source");
const sqlite3 = require('sqlite3').verbose();

function buildAndParseData(db) {
    fetch("https://wf.snekw.com/void-wiki")
        .then(res => res.json())
        .then(json => {
            json.data.Relics.forEach((relic) => {
                insertRelic(db, relic)
                    .then(function (res) {
                        console.log(res);
                    })
                    .catch(function (error) { console.error(error); })
                    .finally(function () {
                        relic.Drops.forEach((item) => {
                            insertPrimePart(db, item, relic)
                                .then((res) => { console.log(res) })
                                .catch((err) => { console.log(err) })
                        });
                    })
            });
        })
        .catch(function (error) { console.error(error); })
}

function itemExists(db, name) {
    return new Promise((resolve, reject) => {
        db.get('SELECT count(*) cnt from prime_parts_prices where name = ?', [name], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            if (row.cnt == 0) {
                resolve(false);
                return;
            } else {
                resolve(true);
                return;
            }
        });
    });
}

function insertRelic(db, relic) {
    return new Promise((resolve, reject) => {
        try {
            db.run(db_utility.relic_insert, [relic.Name, relic.Tier, ('IsVaulted' in relic) ? relic.IsVaulted : 0], (err) => {
                if (err) {
                    reject(err.message);
                    return;
                }
                resolve(`${relic.Name} ${relic.Tier} inserted.`);
            });
        } catch (err) {
            reject(err.message);
        }
    })
}

function insertPrimePart(db, item, relic) {
    return new Promise((resolve, reject) => {
        try {
            itemExists(db, `${item.Item + ' ' + item.Part}`.toLowerCase())
                .then((res) => {
                    if (!res) {
                        let WFmatches = item.Part.match(/(SYSTEMS|NEUROPTICS|CHASSIS)/)

                        let word = "";

                        if (WFmatches != null) {
                            word = WFmatches[0];
                        } else {
                            let BPmatches = item.Part.match(/(BLUEPRINT)/);
                            if (BPmatches != null) {
                                word = BPmatches[0];
                            } else {
                                word = item.Part;
                            }
                        }

                        let part = (item.Item === 'FORMA')
                            ? {
                                name: `${item.Item + ' ' + item.Part}`.toLowerCase(),
                                rarity: item.Rarity,
                                url: `N/A`,
                                tradeable: 0
                            }
                            : {
                                name: `${item.Item} Prime ${item.Part}`.toLowerCase(),
                                rarity: item.Rarity,
                                url: `https://api.warframe.market/v1/items/${(item.Item + '_prime_' + word).replace(/[' \-&]/g, m => db_utility.replace_char[m])}/statistics`.toLowerCase(),
                                tradeable: 1
                            };

                        db.run(db_utility.prime_part_prices_insert, [part.name, part.url, part.tradeable, Date.now(), 0, 0], (err) => {
                            if (err) {
                                db.run(db_utility.prime_part_insert, [relic.Name, relic.Tier, part.name, part.rarity], (err) => {
                                    if (err) {
                                        reject(err.message);
                                        return;
                                    } else {
                                        resolve(`${part.name} has been mapped to ${relic.Name + ' ' + relic.Tier}!`);
                                        return;
                                    }
                                });
                                reject(part.name + " " + err.message);
                                return;
                            }
                            db.run(db_utility.prime_part_insert, [relic.Name, relic.Tier, part.name, part.rarity], (err) => {
                                if (err) {
                                    reject(err.message);
                                    return;
                                } else {
                                    resolve(`${part.name} has been inserted and mapped!`);
                                }
                            })
                        });
                    } else {
                        reject(`EXISTS: ${item.Item + ' ' + item.Part}`)
                        return;
                    }
                })
                .catch((err) => {
                    reject(err.message);
                    return;
                });

        } catch (err) {
            reject(err.message);
        }
    })
}

try {

    let db = new sqlite3.Database('./db/warframe.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            throw err.message;
        }
        console.log('Connected to the in-memory SQlite database.');
    });

    db.run(db_utility.relic_table, [], (err) => {
        if (err) {
            throw err
        }
        db.run(db_utility.prime_parts_prices, [], (err) => {
            if (err) {
                throw err
            }
            db.run(db_utility.prime_parts_table, [], (err) => {
                if (err) {
                    throw err
                }
                console.log('Tables Succesfully Created');
                buildAndParseData(db);
            });
        });
    });

} catch (err) {
    throw (err);
}
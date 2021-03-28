const fetch   = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();
const db_utlity = require('./db_source');

let db = new sqlite3.Database(db_utlity.database, (err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to the warframe database.');
  });

db.run(db_utlity.relic_table, (err) => {
    if(err){
        throw err;
    }
    console.log('Successful table insert - Relic');
});

db.run(db_utlity.prime_parts_table, (err) => {
    if(err){
        throw err;
    }
    console.log('Successful table insert - PP');
});

fetch("https://wf.snekw.com/void-wiki")
    .then(res => res.json())
    .then(json => { 
        json.data.Relics.forEach(relic => {
            db_utlity.I_insert_relic(db,relic)
            relic.Drops.forEach(item => {
                db_utlity.I_prime_part(db,item)
            });
        });
});

const fetch = require('node-fetch');
const Database = require('sqlite-async');
const db_utility = require('./db_source');


function get_data(url){
    return new Promise((resolve,reject) => {
        fetch(url)
            .then(res => res.json())
            .then(res => resolve(res))
            .catch(err => reject(err))
    })
}

Database.open(db_utility.database,Database.OPEN_READWRITE)
    .then(db => {
        console.info("Database Opened Sucessfully.. 25%");
        db.run(db_utility.mods_table)
            .then(res => {
                console.info("Mod Table Created Successfully.. 50%")
                get_data('https://wf.snekw.com/mods-wiki')
                    .then(json =>{
                        let count = 0

                        for (const [key,value] of Object.entries(json.data.Mods)) {
                            db.run(db_utility.mod_insert,value.Name, (value.Rarity == null ? 'N/A' : value.Rarity),`https://api.warframe.market/v1/items/${value.Name.replace(/[' ]/g, m=>db_utility.replace_char[m]).toLowerCase()}/statistics`,Date.now(),0,0,0,0)
                            .then(res => {
                                count++
                                console.log(`Mod Inserted: ${value.Name}, ${(count/Object.keys(json.data.Mods).length) * 100}% complete`)
                            })
                            .catch(err => {throw err})
                        }
                    })
                    .catch(err => {throw err})
            })
            .catch(err => {throw err})
    })
    .catch(err => {throw err})

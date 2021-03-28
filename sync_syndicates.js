const Database = require('sqlite-async');
const db_utility = require('./db_source');
const syndicate_data = require('./syndicates')

Database.open(db_utility.database,Database.OPEN_READWRITE)
    .then(db => {
        console.info("Database Opened Sucessfully.. 25%");
        db.run(db_utility.syndicate_table)
            .then(res => {
                console.info("Syndicate Table Created Successfully.. 50%")
                db.run(db_utility.syndicate_offerings_table)
                .then(res => {
                    console.info("Syndicate Offering Table Created Successfully.. 75%")
                    syndicate_data.syndicates.forEach(syndicate => {
                        db.run(db_utility.syndicate_insert, syndicate.name,Date.now())
                        .then(res => {
                            syndicate.offerings.forEach(item => {
                                let statement = (item.type === "Mod") ? db_utility.mod_select_name : db_utility.weapon_select_name;
                                db.get(statement,item.name)
                                .then(res =>{
                                    if(res == null){return}
                                    let mod_id = (statement===db_utility.mod_select_name?((res.id==null)?-5:res.id):-1)
                                    let weapon_id = (statement===db_utility.weapon_select_name?-1:-1) //TODO: FIX WEAPON ID
                                    db.run(db_utility.syndicate_offering_insert,mod_id,weapon_id,item.offering,Date.now())
                                    .then(res =>{console.log(`Offering inserted: ${item.name}`)})
                                    .catch(err => {throw err})
                                })
                                .catch(err=>{throw err})
                            })
                        })
                        .catch(err=>{throw err})
                    });
                })
                .catch(err => {throw err})
            })
            .catch(err => {throw err})
    })
    .catch(err => {throw err})

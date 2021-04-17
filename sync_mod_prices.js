const fetch = require("node-fetch");
const Database = require("sqlite-async");
const db_utility = require("./db_source");

var RateLimiter = require("limiter").RateLimiter;
var limiter = new RateLimiter(3, "second");

function getData(url) {
  return new Promise((resolve, reject) => {
    try {
      fetch(url)
        .then((res) => res.json())
        .then((res) => resolve(res))
        .catch((err) => {
          throw err;
        });
    } catch {
      reject("caught itbb");
    }
  });
}

/**
 * 
 * @param {[Object]} arr 
 */
function retrieveRow(arr, rank, timestamp) {
  for(const row in arr){
    if(arr[row].mod_rank == rank && arr[row].timestamp == timestamp){
      return arr[row].avg_price;
    }
  }
  throw new Error(`No row found. Rank: ${rank}, Timestamp: ${timestamp}`);
}

function updateMod(db, id, data) {
  return new Promise((resolve, reject) => {
    try {
      let current_data = Array.from(
        Array.from(data.payload.statistics_live["48hours"]),
        (x) =>
          JSON.parse(
            JSON.stringify({
              avg_price: x.avg_price,
              mod_rank: x.mod_rank,
              timestamp: new Date(x.datetime).getTime(),
            })
          )
      );

      ds = {};

      current_data.forEach((mod) => {
        if (mod.mod_rank in ds) {
          ds[mod.mod_rank].push(mod.timestamp);
        }else{
          ds[mod.mod_rank] = [mod.timestamp];
        }
      });

      console.log(ds);
      console.log(Object.keys(ds));
      
      let minRank = Math.min(...Object.keys(ds));
      let maxRank = Math.max(...Object.keys(ds));

      let dateMin = Math.max(...ds[minRank]);
      let dateMax = Math.max(...ds[maxRank]);


      console.log(`Min: ${minRank} || Max: ${maxRank}`);
      console.log(`minDate: ${dateMin} || maxDate: ${dateMax}`);

      let price_min = retrieveRow(current_data,minRank,dateMin);
      let price_max = retrieveRow(current_data,maxRank,dateMax);

      console.log(`Price Min: ${price_min} || Price Max: ${price_max}`);

      let data_set = {
        id: id,
        price_min:price_min,
        price_max:price_max,
        last_update: Date.now(),
      };

      console.log(data_set);
      db.run(
        db_utility.mod_update,
        data_set.last_update,
        data_set.price_min,
        data_set.price_max,
        data_set.id
      )
        .then(resolve(`Success: ${id}`))
        .catch((err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

try {
  Database.open("./db/warframe.db", Database.OPEN_READWRITE)
    .then((db) => {
      console.log(db);
      db.run(db_utility.mods_table)
        .then(() => {
          db.all("SELECT * from mods")
            .then((rows) => {
              rows.forEach(async (row) => {
                console.log(`Sending get datarequest for ${row.id}`);
                limiter.removeTokens(1, function () {
                  getData(row.url)
                    .then((res) => {
                      updateMod(db, row.id, res)
                        .then((res) =>
                          console.log(`Mod: ${row.id} updated! message: ${res}`)
                        )
                        .catch((err) => {
                          throw err;
                        });
                    })
                    .catch((err) => {
                      throw err;
                    });
                });
              });
            })
            .catch((err) => {
              throw err;
            });
        })
        .catch((err) => {
          throw err;
        });
    })
    .catch((err) => {
      throw err;
    });
} catch (err) {
  console.log("caught it?");
}

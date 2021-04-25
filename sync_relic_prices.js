const fetch = require("node-fetch");
const Database = require("sqlite-async");
const db_utility = require("./db_source");

var RateLimiter = require("limiter").RateLimiter;
var limiter = new RateLimiter(2, "second");

function getData(url) {
  return new Promise((resolve, reject) => {
    try {
      fetch(url)
        .then((res) => res.json())
        .then((res) => resolve(res))
        .catch((err) => {
          console.error(err);
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
function retrieveRow(arr, timestamp) {
  for (const row in arr) {
    if (arr[row].timestamp == timestamp) {
      return arr[row].avg_price;
    }
  }
  throw new Error(`No row found. Timestamp: ${timestamp}`);
}

function updateMod(db, id, data, url) {
  return new Promise((resolve, reject) => {
    try {

      if (!("statistics_live" in data.payload)) {
        console.error("statistics_live not present");
        reject('Item has no payload');
      }

      if (data.payload.statistics_live["48hours"].length == 0) {
        reject('Item has no 48hours payload.');
      } else {

        let current_data = Array.from(
          Array.from(data.payload.statistics_live["48hours"]),
          (x) =>
            JSON.parse(
              JSON.stringify({
                avg_price: x.avg_price,
                timestamp: new Date(x.datetime).getTime(),
              })
            )
        );

        let maxTime = 0;

        current_data.forEach(row => {
          maxTime = (maxTime < row.timestamp) ? row.timestamp : maxTime;
        });

        let price_max = retrieveRow(current_data, maxTime);

        let data_set = {
          id: id,
          price: price_max,
          last_update: Date.now(),
        };

        db.run(
          db_utility.prime_part_prices_update,
          data_set.last_update,
          data_set.price,
          data_set.id
        )
          .then(resolve(`Success: ${id}`))
          .catch((err) => reject(err));
      }
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
          db.all("SELECT * FROM prime_parts_prices WHERE url <> 'N/A'")
            .then((rows) => {
              let counter = 0;
              rows.forEach(async (row) => {
                limiter.removeTokens(1, function () {
                  getData(row.url)
                    .then((res) => {
                      if ("error" in res) {
                        throw new Error(`BAD URL: ${row.url}`);
                      }
                      updateMod(db, row.id, res, row.url)
                        .then((res) => {
                          counter += 1;
                          console.log(`Item: ${row.name} has been updated ${Math.trunc((counter / rows.length)*100)}% Complete`);
                        })
                        .catch((err) => {
                          console.error(err);
                        });
                    })
                    .catch((err) => {
                      console.error(err);
                    });
                });
              });
            })
            .catch((err) => {
              console.error(err);
            });
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((err) => {
      console.error(err);
    });
} catch (err) {
  console.log("caught it?");
}
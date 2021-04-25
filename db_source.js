
/**
 * Sources
 */
const database = './db/warframe.db'

/**
 * Table Definitions
 */
const mods_table =
  `
 CREATE TABLE IF NOT EXISTS mods (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT not null,
     rarity TEXT not null,
     url TEXT not null,
     tradeable INTEGER not null,
     last_update INTEGER not null,
     count_min INTEGER not null,
     count_max INTEGER not null,
     price_min REAL not null,
     price_max REAL not null
 )
 `

const relic_table =
  `
  CREATE TABLE IF NOT EXISTS relics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT not null,
    tier TEXT not null,
    vaulted INTEGER not null
  );
`

const relics_schema = `
CREATE TABLE IF NOT EXISTS relics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT not null,
  tier TEXT not null,
  vaulted INTEGER not null
);

CREATE TABLE IF NOT EXISTS prime_parts_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT not null UNIQUE,
  url TEXT not null,
  tradeable INTEGER not null,
  last_update INTEGER not null,
  count INTEGER not null,
  price REAL not null
);

CREATE TABLE IF NOT EXISTS prime_parts (
  relic_id INTEGER not null,
  part_id INTEGER not null,
  rarity TEXT not null,
  FOREIGN KEY(relic_id) REFERENCES relic_table(id),
  FOREIGN KEY(part_id) REFERENCES prime_parts_prices(id)
);
`;

const prime_parts_table =
  `
CREATE TABLE IF NOT EXISTS prime_parts (
  relic_id INTEGER not null,
  part_id INTEGER not null,
  rarity TEXT not null,
  FOREIGN KEY(relic_id) REFERENCES relic_table(id),
  FOREIGN KEY(part_id) REFERENCES prime_parts_prices(id)
);
`

const prime_part_insert =
  `INSERT INTO prime_parts (relic_id, part_id, rarity) VALUES (
    (SELECT id FROM relics where name = ? and tier = ?),
    (SELECT id from prime_parts_prices where name = ?),
    ?
  );`

const prime_parts_prices =
`
CREATE TABLE IF NOT EXISTS prime_parts_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT not null UNIQUE,
  url TEXT not null,
  tradeable INTEGER not null,
  last_update INTEGER not null,
  count INTEGER not null,
  price REAL not null
);
`
const prime_part_prices_insert =
`INSERT INTO prime_parts_prices (name, url, tradeable, last_update, count, price) VALUES (?,?,?,?,?,?)`

const prime_part_prices_update =
`UPDATE prime_parts_prices
    SET last_update = ?,
        price = ?
  WHERE id = ?
`;
/*
  `INSERT INTO prime_parts (relic_id, part_id, rarity) VALUES (?,?,?)
    SELECT id FROM relics where name = ? AND tier = ?
  ),?,?,?,?,?,?,?)`
*/

const weapons_table =
  `
CREATE TABLE IF NOT EXISTS weapons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT not null,
  url TEXT not null,
  last_update INTEGER not null,
  count INTEGER not null,
  price REAL not null
)
`

const syndicate_table =
  `
CREATE TABLE IF NOT EXISTS syndicates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT not null,
  last_update INTEGER not null
)
`

const syndicate_offerings_table =
  `
CREATE TABLE IF NOT EXISTS syndicate_offerings (
  syndicate_id INTEGER not null,
  mod_id INTEGER,
  weapon_id INTEGER,
  offering_cost INTEGER not null,
  last_update INTEGER not null,
  FOREIGN KEY(syndicate_id) REFERENCES syndicates(id)
  FOREIGN KEY(mod_id) REFERENCES mods(id)
  FOREIGN KEY(weapon_id) REFERENCES weapons(id)
)
`

/**
 * Queries
 */
const mod_insert_replace =
  `INSERT OR REPLACE INTO mods(name,url,last_update,count_min,count_max,price_min,price_max) Values (?,?,?,?,?,?,?)`

const mod_update =
  `UPDATE mods SET last_update = ?, price_min = ?, price_max = ? WHERE id = ?`

const mod_select =
  `SELECT id, url FROM mods WHERE id in (select mod_id from syndicate_offerings where mod_id <> -1)`

const mod_select_name =
  `SELECT id id FROM mods where name = ?`

const weapon_select_name =
  `SELECT id id from weapons where name = ?`

const relic_insert =
  `INSERT INTO relics(name, tier, vaulted) VALUES (?,?,?)`

const prime_part_update =
  `UPDATE prime_parts SET last_update = ?, price = ? WHERE id = ?`

const get_rowid =
  `select seq id from sqlite_sequence where name = ?`

const mod_insert =
  `INSERT INTO mods(name,rarity,url,tradeable,last_update,count_min,count_max,price_min,price_max) Values (?,?,?,?,?,?,?,?,?)`

const syndicate_insert =
  `INSERT INTO syndicates(name,last_update) VALUES (?,?)`

const syndicate_offering_insert =
  `INSERT INTO syndicate_offerings(syndicate_id,mod_id,weapon_id,offering_cost,last_update) VALUES ((select seq id from sqlite_sequence where name = 'syndicates'),?,?,?,?)`

const replace_char = { '\'': '', ' ': '_', '-': '_', '&': 'and' }

const database_schema = `${relic_table+'\n'+prime_parts_prices+'\n'+prime_parts_table}`

module.exports = {
  database,
  mods_table,
  relic_table,
  weapons_table,
  syndicate_table,
  prime_parts_table,
  syndicate_offerings_table,
  mod_insert_replace,
  mod_insert,
  mod_update,
  mod_select,
  mod_select_name,
  weapon_select_name,
  relic_insert,
  prime_part_insert,
  get_rowid,
  syndicate_insert,
  syndicate_offering_insert,
  replace_char,
  prime_part_update,
  prime_parts_prices,
  prime_part_prices_insert,
  relics_schema,
  prime_part_prices_update
}
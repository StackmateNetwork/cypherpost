/*
cypherpost.io
Developed @ Stackmate India
*/
// -----° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °-----------
import { logger } from "./lib/logger/winston";
import { start as startServer } from "./server";
import { MongoDatabase } from "./lib/storage/mongo";
const db = new MongoDatabase();
// -----° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °-----------

db.connect({
  port: process.env.DB_PORT,
  ip: process.env.DB_IP,
  name: process.env.DB_NAME,
  auth: process.env.DB_AUTH
}).catch(e => {
  logger.error(e);
  process.exit(1);
});

startServer(process.env.MOLTRES_PORT).catch(e => {
  logger.error(e);
  process.exit(1);
});

// -----° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °-----------

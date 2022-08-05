/*
cypherpost.io
Developed @ Stackmate India
*/
// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
import mongoose from "mongoose";
import { handleError } from "../../lib/errors/e";
import { Announcement, AnnouncementStore, AnnouncementType } from "./interface";
// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
const announcement_schema = new mongoose.Schema(
  {
    genesis: {
      type: Number,
      required: true,
    },
    by: {
      type: String,
      required: true,
      index: true
    },
    to: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      unique: true,
      required: true,
      index: true,
      dropDups: true
    },
    nonce: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    }
  },
  {
    strict: true
  }
);
// ------------------ '(◣ ◢)' ---------------------
const announcementStore = mongoose.model("announcement", announcement_schema);
// ------------------ '(◣ ◢)' ---------------------
export class MongoAnnouncementStore implements AnnouncementStore {
  async create(announcement: Announcement): Promise<boolean | Error> {
    try {
      await announcementStore.syncIndexes();
      const doc = await announcementStore.create(announcement);
      if (doc instanceof Error) {
        return handleError(doc);
      } else {
        return true;
      }
    } catch (e) {
      if (e['code'] && e['code'] === 11000) {
        return handleError({
          code: 409,
          message: "Duplicate Index."
        })
      }
      return handleError(e);
    }
  }
  async removeByReceiver(by: string, to: string, type: AnnouncementType): Promise<boolean | Error> {
    try {
      const query = { by, to, type };

      const status = await announcementStore.deleteOne(query)
      if (status instanceof Error) {
        return handleError(status);
      }

      if (status.deletedCount >= 1) return true;
      else return false;
    } catch (e) {
      return handleError(e);
    }
  }
  async removeAll(pubkey: string): Promise<boolean | Error> {
    try {
      const by_query = { by : {$in: pubkey} };

      let status = await announcementStore.deleteMany(by_query)
      if (status instanceof Error) {
        return handleError(status);
      }

      const to_query = { to : {$in: pubkey} };

      status = await announcementStore.deleteMany(to_query)
      if (status instanceof Error) {
        return handleError(status);
      }
      return true;
    } catch (e) {
      return handleError(e);
    }
  }
  async removeAllTest(): Promise<boolean | Error> {
    try {
      const status = await announcementStore.deleteMany();
      if (status instanceof Error) {
        return handleError(status);
      }

      return true;
    } catch (e) {
      return handleError(e);
    }
  }
  async readByMaker(by: string, genesis_filter: number): Promise<Announcement[] | Error> {
    try {
      const query = { by: { $in: by }, genesis: {$gte: genesis_filter} };

      const docs = await announcementStore.find(query).sort({ "genesis": -1 }).exec();
      if (docs instanceof Error) {
        return handleError(docs);
      }

      if (docs.length > 0) {
        const announcements = docs.map(doc => {
          return {
            genesis: doc["genesis"],
            hash: doc["hash"],
            by: doc["by"],
            to: doc["to"],
            signature: doc["signature"],
            type: doc["type"],
            nonce: doc["nonce"],
          }
        });
        return announcements;
      } else {
        return [];
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async readAll(genesis_filter: number): Promise<Announcement[] | Error> {
    try {
      const docs = await announcementStore.find({genesis: {$gte: genesis_filter}}).sort({ "genesis": -1 }).exec();
      if (docs instanceof Error) {
        return handleError(docs);
      }

      if (docs.length > 0) {
        const announcements = docs.map(doc => {
          return {
            genesis: doc["genesis"],
            hash: doc["hash"],
            by: doc["by"],
            to: doc["to"],
            signature: doc["signature"],
            type: doc["type"],
            nonce: doc["nonce"],

          }
        });
        return announcements;
      } else {
        return [];
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async readByReceiver(to: string,  genesis_filter: number): Promise<Announcement[] | Error> {
    try {
      const query = { to: { $in: to },  genesis: {$gte: genesis_filter} };
      const docs = await announcementStore.find(query).sort({ "genesis": -1 }).exec();
      if (docs instanceof Error) {
        return handleError(docs);
      }

      if (docs.length > 0) {
        const announcements = docs.map(doc => {
          return {
            genesis: doc["genesis"],
            hash: doc["hash"],
            by: doc["by"],
            to: doc["to"],
            signature: doc["signature"],
            type: doc["type"],
            nonce: doc["nonce"],
          }
        });
        return announcements;
      } else
        return [];

    } catch (e) {
      return handleError(e);
    }
  }

}

// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------

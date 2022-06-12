/*
cypherpost.io
Developed @ Stackmate India
*/

import crypto from "crypto";
import { CypherpostBitcoinOps } from "../../lib/bitcoin/bitcoin";
import { handleError } from "../../lib/errors/e";
import { S5UID } from "../../lib/uid/uid";
import { Announcement, AnnouncementInterface, AnnouncementType } from "./interface";
import { MongoAnnouncementStore } from "./mongo";

const store = new MongoAnnouncementStore();
const uuid = new S5UID();
const bitcoin = new CypherpostBitcoinOps();

export class CypherpostAnnouncements implements AnnouncementInterface {
  getAll(genesis_filter: Number): Promise<Announcement[] | Error> {
    return store.readAll(genesis_filter);
  }
  removeAllOfUser(pubkey: string): Promise<boolean | Error> {
    return store.removeAll(pubkey);
  }
  async create(by: string, to: string, type: AnnouncementType, nonce: string, signature: string): Promise<boolean | Error> {
    try{
  
      const announcement_message = `${by}:${to}:${type.toString()}:${nonce}`;
      // console.log({badge_message});
      // console.log({signature});
      const verify = await bitcoin.verify(announcement_message, signature,by);
      if (verify instanceof Error) return verify;
      if (!verify) return handleError({
        code: 400,
        message: "Invalid badge signature"
      });
      const badge: Announcement = {
        genesis: Date.now(),
        by: by,
        to: to,
        type: type,
        hash:crypto.createHash("sha256").update(`${by}:${to}:${type.toString()}`).digest("hex"),
        nonce,
        signature,
      };

      // console.log({badge})
      return store.create(badge);
    }catch(e){
      handleError(e);
    }
  }
  findByMaker(by: string, genesis_filter: Number): Promise<Error | Announcement[]> {
    return store.readByMaker(by,genesis_filter);
  }
  findByReciever(to: string,genesis_filter: Number): Promise<Error | Announcement[]> {
    return store.readByReciever(to,genesis_filter);
  }
  revoke(by: string, to: string, type: AnnouncementType): Promise<boolean | Error> {
    return store.removeByReciever(by,to, type);
  }

}
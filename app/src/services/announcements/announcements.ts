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
  getAll(genesis_filter: number): Promise<Announcement[] | Error> {
    return store.readAll(genesis_filter);
  }
  removeAllOfUser(pubkey: string): Promise<boolean | Error> {
    return store.removeAll(pubkey);
  }
  async create(by: string, to: string, kind: AnnouncementType, nonce: string, signature: string): Promise<boolean | Error> {
    try{
      const announcement_message = `${by}:${to}:${kind.toString()}:${nonce}`;
      console.log({announcement_message});
      // console.log({signature});
      const verify = await bitcoin.verify(announcement_message, signature,by);
      if (verify instanceof Error) return verify;
      if (!verify) return handleError({
        code: 400,
        message: "Invalid badge signature"
      });
      const badge: Announcement = {
        genesis: Date.now(),
        by,
        to,
        kind: kind,
        hash:crypto.createHash("sha256").update(`${by}:${to}:${kind.toString()}`).digest("hex"),
        nonce,
        signature,
      };

      // console.log({badge})
      return store.create(badge);
    }catch(e){
      handleError(e);
    }
  }
  findByMaker(by: string, genesis_filter: number): Promise<Error | Announcement[]> {
    return store.readByMaker(by,genesis_filter);
  }
  findByReceiver(to: string,genesis_filter: number): Promise<Error | Announcement[]> {
    return store.readByReceiver(to,genesis_filter);
  }
  revoke(by: string, to: string, kind: AnnouncementType): Promise<boolean | Error> {
    return store.removeByReceiver(by,to, kind);
  }

}
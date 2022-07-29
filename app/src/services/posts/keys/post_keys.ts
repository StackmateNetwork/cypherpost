/*
cypherpost.io
Developed @ Stackmate India
*/

import * as crypto from "crypto";
import { handleError } from "../../../lib/errors/e";
import { S5UID } from "../../../lib/uid/uid";
import { PostDecryptionKey, PostKeyInterface, PostKeyStoreUpdate } from "./interface";
import { MongoPostKeyStore } from "./mongo";

const store = new MongoPostKeyStore();
const uuid = new S5UID();

export class CypherpostPostKeys implements PostKeyInterface {
  async removeAllPostDecryptionKeyOfUser(pubkey: string): Promise<boolean | Error> {
    try {
      let status = await store.removeAllGiver(pubkey);
      if (status instanceof Error) return status;
      status = await store.removeAllReceiver(pubkey);
      return status;
    }
    catch (e) {
      handleError(e);
    }
  }
  async addPostDecryptionKeys(giver: string, post_id: string, key_update: PostKeyStoreUpdate[]): Promise<boolean | Error> {
    try {
      let keys = [];
      key_update.map(key => {
        keys.push({
          genesis: Date.now(),
          giver: giver,
          post_id,
          receiver: key.receiver,
          hash: crypto.createHash("sha256").update(`${giver}:${key.receiver}:${post_id}`).digest('hex'),
          decryption_key: key.decryption_key
        })
      });
      return await store.createMany(keys);
    }
    catch (e) {
      handleError(e);
    }
  }
  async updatePostDecryptionKeys(giver: string, post_id: string, key_update: PostKeyStoreUpdate[]): Promise<boolean | Error> {
    try {
      let keys = [];
      let updates = await key_update.map(async key => {
        const status = await store.updateOne(giver, post_id, key.receiver, key.decryption_key);
        if (status instanceof Error) throw status;
      });

      Promise.all(updates);
      return true;
    }
    catch (e) {
      handleError(e);
    }
  }
  async findPostDecryptionKeyByReceiver(receiver: string, genesis_filter: Number): Promise<Error | PostDecryptionKey[]> {
    return store.readByReceiver(receiver, genesis_filter);
  }
  
  async findPostDecryptionKeyByGiver(giver: string, genesis_filter: Number): Promise<Error | PostDecryptionKey[]> {
    return store.readByGiver(giver, genesis_filter);
  }
  async findPostDecryptionKeyById(post_id: string): Promise<Error | PostDecryptionKey[]> {
    return store.readByPostId(post_id);
  }
  async removePostDecryptionKeyById(giver: string, id: string): Promise<boolean | Error> {
    return store.removeManyByPostId(giver, id);
  }
  async removePostDecryptionKeyByReceiver(giver: string, receiver: string): Promise<boolean | Error> {
    return store.removeManyByReceiver(giver, receiver);
  }
  async removePostDecryptionKeyByGiver(giver: string): Promise<boolean | Error> {
    return store.removeAllGiver(giver);
  }

}
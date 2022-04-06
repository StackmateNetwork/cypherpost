/*
cypherpost.io
Developed @ Stackmate India
*/

import { CypherpostBitcoinOps } from "../../lib/bitcoin/bitcoin";
import { S5Crypto } from "../../lib/crypto/crypto";
import { handleError } from "../../lib/errors/e";
import * as jwt from "../../lib/jwt/jwt";
import { S5UID } from "../../lib/uid/uid";
import { IdentityIndex, IdentityInterface, RegistrationType, UserIdentity } from "./interface";
import { MongoIdentityStore } from "./mongo";



const uid = new S5UID();
const TYPE = process.env.TYPE;
const INVITE_CODE = process.env.SECRET;

const bitcoin = new CypherpostBitcoinOps();
const local_jwt = new jwt.S5LocalJWT();
const store = new MongoIdentityStore();
const crypto = new S5Crypto();

const ONE_HOUR = 60 * 60 * 1000;

export class CypherpostIdentity implements IdentityInterface {
  async verify(pubkey: string, message: string, signature: string): Promise<boolean | Error> {
    const identity = await store.readOne(pubkey, IdentityIndex.Pubkey);
    if (identity instanceof Error) return identity;
    
    if (!identity.verified){
      return handleError({
        code: TYPE.toLowerCase()==="public"?402:401,
        message: TYPE.toLowerCase()==="public"?"Payment Required.":"Register with invite code."
      });
    }
    let verified = await bitcoin.verify(message, signature, pubkey);
    if(verified instanceof Error) return verified;
    if (!verified) return handleError({
      code: 401,
      message: "Invalid Request Signature."
    });
    else return verified;
  }

  async register(username: string, pubkey: string, type: RegistrationType): Promise<boolean | Error> {
    const new_identity: UserIdentity = {
      genesis: Date.now(),
      username,
      pubkey: pubkey,
      verified: type === RegistrationType.Payment ? false:true
    };

    const status = await store.createOne(new_identity);
    return status;
  };

  async remove(pubkey: string): Promise<boolean | Error> {
    const status = await store.removeOne(pubkey);
    return status;
  }

  async all(genesis_filter: Number): Promise<Array<UserIdentity> | Error> {
    const identities = await store.readAll(genesis_filter);
    return identities;
  }

};


/*
cypherpost.io
Developed @ Stackmate India
*/

import { mongo } from "mongoose";
import { CypherpostBitcoinOps } from "../../lib/bitcoin/bitcoin";
import { S5Crypto } from "../../lib/crypto/crypto";
import { handleError } from "../../lib/errors/e";
import * as jwt from "../../lib/jwt/jwt";
import { S5UID } from "../../lib/uid/uid";
import { IdentityIndex, IdentityInterface, InvitationCodeStatus,InvitationCodeType, RegistrationType, UserIdentity, VerificationStatus } from "./interface";
import { MongoIdentityStore, MongoInviteStore } from "./mongo";

const uid = new S5UID();
const TYPE = process.env.TYPE;

const bitcoin = new CypherpostBitcoinOps();
const local_jwt = new jwt.S5LocalJWT();
const idStore = new MongoIdentityStore();
const inviteStore = new MongoInviteStore();

const crypto = new S5Crypto();

const ONE_HOUR = 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * ONE_HOUR;

export class CypherpostIdentity implements IdentityInterface {

  async register(username: string, pubkey: string, type: RegistrationType, invite_code?: string): Promise<boolean | Error> {
    if (type === RegistrationType.Invite){
      const checkInviteStatus = await inviteStore.checkOneByStatus(invite_code, InvitationCodeStatus.Unclaimed);
      if(checkInviteStatus instanceof Error) return checkInviteStatus;
      if(!checkInviteStatus) return handleError({
        code: 400,
        message: "Invite code invalid or already claimed."
      });
    }
    const new_identity: UserIdentity = {
      genesis: Date.now(),
      username,
      pubkey,
      status: type === RegistrationType.Payment ? VerificationStatus.Pending:VerificationStatus.Verified,
    };

    const createStatus = await idStore.createOne(new_identity);
    if (createStatus instanceof Error) return createStatus;

    if (type === RegistrationType.Invite){
      const update = await inviteStore.updateOneStatus(invite_code,InvitationCodeStatus.Claimed, pubkey);
      if (update instanceof Error) return update;
    }

    return createStatus;
  }
  async authenticate(pubkey: string, message: string, signature: string): Promise<boolean | Error> {
    if (signature == "")return handleError({
      code: 401,
      message: "Signature Required."
    });

    const identity = await idStore.readOne(pubkey, IdentityIndex.Pubkey);
    if (identity instanceof Error) return identity;

    if (
        identity.status===VerificationStatus.Pending ||
        (identity.status === VerificationStatus.Partial && identity.genesis + THIRTY_DAYS > Date.now())
      )
    {
      return handleError({
        code: TYPE.toLowerCase()==="public"?402:401,
        message: TYPE.toLowerCase()==="public"?"Payment Required.":"Register with invite code."
      });
    }

    const verified = await bitcoin.verify(message, signature, pubkey);
    if(verified instanceof Error) return verified;
    if (!verified) return handleError({
      code: 401,
      message: "Invalid Request Signature."
    });
    else return verified;
  }
  async remove(pubkey: string): Promise<boolean | Error> {
    const status = await idStore.removeOne(pubkey);
    return status;
  }
  async updateStatus(pubkey: string, status: VerificationStatus): Promise<boolean | Error> {
    const result = await idStore.updateOne(pubkey,status);
    return result;
  }
  async all(genesis_filter: number): Promise<Array<UserIdentity> | Error> {
    const identities = await idStore.readAll(genesis_filter);
    return identities;
  }
  async createInviteAsAdmin(type: InvitationCodeType): Promise<string | Error> {
   const code =  uid.createRandomID(32);
   const created = await inviteStore.createOne(code,type,"ADMIN");
   if(created instanceof Error) return created;
   else return code;
  }

  async createInviteAsUser(invite_secret: string): Promise<string | Error>{
    const inviteCode = await inviteStore.findOneByType(invite_secret, InvitationCodeType.Privileged);
    if(inviteCode instanceof Error) return inviteCode;
    if(inviteCode['count'] == 0) return handleError({
      code: 400,
      message: "Invite code privelage exhausted."
    });
  
    const code =  uid.createRandomID(32);
    const created = await inviteStore.createOne(code,InvitationCodeType.Standard,inviteCode['claimed_by']);
    if(created instanceof Error) return created;

    const decStatus = await inviteStore.decrementCount(invite_secret);
    if(decStatus instanceof Error) return decStatus;

    return code;
  }
};


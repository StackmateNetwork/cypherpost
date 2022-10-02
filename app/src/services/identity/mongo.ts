/*
cypherpost.io
Developed @ Stackmate India
*/
// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
import mongoose from "mongoose";
import { handleError } from "../../lib/errors/e";
import { IdentityIndex, IdentityStore, InvitationCodeStatus, InvitationCodeType, InviteStore, UserIdentity, VerificationStatus } from "./interface";

// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
const identity_schema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    pubkey: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    genesis: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "PENDING"
    }
  }
);
// ------------------ '(◣ ◢)' ---------------------
const identityStore = mongoose.model("identity", identity_schema);
// ------------------ '(◣ ◢)' ---------------------
export class MongoIdentityStore implements IdentityStore {

  async createOne(identity: UserIdentity): Promise<boolean | Error> {
    try {
      await identityStore.syncIndexes();
      const doc = await identityStore.create(identity);
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
  async removeOne(pubkey: string): Promise<boolean | Error> {
    try {
      const query = { pubkey };
      const status = await identityStore.deleteMany(query)
      if (status instanceof Error) {
        return handleError(status);
      }
      // console.log({ status })
      if (status.deletedCount >= 1) return true;
      else return false;
    } catch (e) {
      return handleError(e);
    }
  }
  async readOne(index: string, indexType: IdentityIndex): Promise<UserIdentity | Error> {
    try {
      const query = (indexType === IdentityIndex.Username) ? { username: index } : { pubkey: index };
      const doc = await identityStore.findOne(query).exec();

      if (doc) {
        if (doc instanceof Error) {
          return handleError(doc);
        }

        const out: UserIdentity = {
          genesis: doc["genesis"],
          username: doc["username"],
          pubkey: doc["pubkey"],
          status: doc["status"],
        };

        return out;
      } else {
        // no data from findOne
        return handleError({
          code: 404,
          message: `No Identity Entry`
        });
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async readAll(genesis_filter: number): Promise<Array<UserIdentity> | Error> {
    try {
      const docs = await identityStore.find({ genesis: { $gte: genesis_filter } }).exec();
      if (docs instanceof Error) {
        return handleError(docs);
      }
      const identities = docs.map(doc => {
        return {
          genesis: doc["genesis"],
          username: doc["username"],
          pubkey: doc["pubkey"],
          status: doc["status"],
        };
      });
      return identities;
    } catch (e) {
      return handleError(e);
    }
  }
  async updateOne(pubkey: string, status: VerificationStatus): Promise<boolean | Error> {
    try {
      const q = { pubkey };
      const u = { $set: { status: status.toString() } };
      // console.log({q,u})

      const result = await identityStore.updateOne(q, u);
      if (result instanceof Error) {
        return handleError(result);
      };
      return result.modifiedCount > 0 || result.matchedCount >0;
      // if verified if true the document is not updated and will return modifiedCount = 0
      // watchout
    } catch (e) {
      return handleError(e);
    }
  }
}
// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------
// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
const invite_schema = new mongoose.Schema(
  {
    invite_code: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    genesis: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "UNCLAIMED"
    },
    type: {
      type: String,
      required: false,
      default: "STANDARD"
    }
  }
);
// ------------------ '(◣ ◢)' ---------------------
const inviteStore = mongoose.model("invite", invite_schema);
// ------------------ '(◣ ◢)' ---------------------
// tslint:disable-next-line: max-classes-per-file
export class MongoInviteStore implements InviteStore {
  async createOne(invite_code: string,type: InvitationCodeType): Promise<boolean | Error> {
    try {
      await identityStore.syncIndexes();
      const doc = await inviteStore.create({
        invite_code,
        genesis: Date.now(),
        status: InvitationCodeStatus.Unclaimed,
        type: type
      });
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
  async removeOne(invite_code: string): Promise<boolean | Error> {
    try {
      const query = { invite_code };
      const status = await inviteStore.deleteMany(query)
      if (status instanceof Error) {
        return handleError(status);
      }
      if (status.deletedCount >= 1) return true;
      else return false;
    } catch (e) {
      return handleError(e);
    }
  }
  async checkOneStatus(invite_code: string, status: InvitationCodeStatus): Promise<boolean | Error> {
    try {
      const query =  { invite_code, status };
      const doc = await inviteStore.findOne(query).exec();

      if (doc) {
        if (doc instanceof Error) {
          return handleError(doc);
        }
        if (invite_code === doc['invite_code']) return true;
        else return false;
      } else {
        // no data from findOne
        return false;
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async checkOneType(invite_code: string, type: InvitationCodeType): Promise<boolean | Error> {
    try {
      const query =  { invite_code, type };
      const doc = await inviteStore.findOne(query).exec();

      if (doc) {
        if (doc instanceof Error) {
          return handleError(doc);
        }
        if (invite_code === doc['invite_code']) return true;
        else return false;
      } else {
        // no data from findOne
        return false;
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async updateOne(invite_code: string, status: InvitationCodeStatus): Promise<boolean | Error> {
    try {
      const q = { invite_code };
      const u = { $set: { status: status.toString() } };
      // console.log({q,u})

      const result = await inviteStore.updateOne(q, u);
      if (result instanceof Error) {
        return handleError(result);
      };
      return result.modifiedCount > 0 || result.matchedCount >0;
      // if verified if true the document is not updated and will return modifiedCount = 0
      // watchout
    } catch (e) {
      return handleError(e);
    }
  }
}
// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------

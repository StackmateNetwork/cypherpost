/*
cypherpost.io
Developed @ Stackmate India
*/
// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
import mongoose from "mongoose";
import { handleError } from "../../lib/errors/e";
import { IdentityIndex, IdentityStore, InviteCode,InvitationCodeStatus, InvitationCodeType, InviteStore, UserIdentity, VerificationStatus } from "./interface";

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
    },
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
          status: doc["status"] as VerificationStatus,
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
          status: doc["status"] as VerificationStatus,
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
    },
    created_by: {
      type:String,
      required: true,
      default: "ADMIN",
    },
    claimed_by: {
      type:String,
      required: false,
      default: "*UNCLAIMED*"
    },
    count: {
      type: Number,
      required: true,
      default: 0
    }
  }
);
// ------------------ '(◣ ◢)' ---------------------
const inviteStore = mongoose.model("invite", invite_schema);
// ------------------ '(◣ ◢)' ---------------------
// tslint:disable-next-line: max-classes-per-file
export class MongoInviteStore implements InviteStore {
  async createOne(invite_code: string,type: InvitationCodeType,created_by: String, count: number): Promise<boolean | Error> {
    try {
      await identityStore.syncIndexes();
      const doc = await inviteStore.create({
        invite_code,
        genesis: Date.now(),
        status: InvitationCodeStatus.Unclaimed,
        type: type,
        created_by,
        count
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
  async checkOneByStatus(invite_code: string, status: InvitationCodeStatus): Promise<boolean | Error> {
    try {
      const query =  { invite_code, status };
      const doc = await inviteStore.findOne(query).exec();
      if (doc) {
        if (doc instanceof Error) {
          return handleError(doc);
        }
        return true;
      } else {
        // no data from findOne
        return false;
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async findOne(invite_code: string): Promise<InviteCode | Error> {
    try {
      const query =  { invite_code };
      const doc = await inviteStore.findOne(query).exec();

      if (doc) {
        if (doc instanceof Error) {
          return handleError(doc);
        }
        return {
          genesis: doc["genesis"],
          invite_code: doc["invite_code"],
          claimed_by: doc["claimed_by"],
          created_by: doc["created_by"],
          status: doc["status"] as VerificationStatus,
          kind: doc["type"] as InvitationCodeType,
          count: doc["count"],
        };
      } else {
        // no data from findOne
        return handleError({
          code: 404,
          message: "No Invite Code Found."
        });
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async findOneByPubkey(pubkey: string): Promise<InviteCode | Error> {
    try {
      const query =  { claimed_by: pubkey };
      const doc = await inviteStore.findOne(query).exec();

      if (doc) {
        if (doc instanceof Error) {
          return handleError(doc);
        }
        return {
          genesis: doc["genesis"],
          invite_code: doc["invite_code"],
          claimed_by: doc["claimed_by"],
          created_by: doc["created_by"],
          status: doc["status"] as VerificationStatus,
          kind: doc["type"] as InvitationCodeType,
          count: doc["count"],
        };
      } else {
        // no data from findOne
        return handleError({
          code: 404,
          message: "No Invite Code Found."
        });
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async findOneByType(invite_code: string, type: InvitationCodeType): Promise<InviteCode | Error> {
    try {
      const query =  { invite_code, type };
      const doc = await inviteStore.findOne(query).exec();

      if (doc) {
        if (doc instanceof Error) {
          return handleError(doc);
        }
         return {
          genesis: doc["genesis"],
          invite_code: doc["invite_code"],
          claimed_by: doc["claimed_by"],
          created_by: doc["created_by"],
          status: doc["status"] as VerificationStatus,
          kind: doc["type"] as InvitationCodeType,
          count: doc["count"],
        };
      } else {
        return handleError({
          code: 404,
          message: "No InviteCode entry found."
        });
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async updateOneStatus(invite_code: string, status: InvitationCodeStatus, claimed_by: string): Promise<boolean | Error> {
    try {
      const q = { invite_code };
      const u = { $set: { status: status.toString() , claimed_by} };
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
  async decrementCount(invite_code: string): Promise<boolean | Error> {
    try {
      const q = { invite_code };
      const u = { $inc: {"count": -1}};
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

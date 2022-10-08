/*
cypherpost.io
Developed @ Stackmate India
*/
// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
import mongoose from "mongoose";
import { handleError } from "../../lib/errors/e";
import { DerivationStore, PostStore, PostStoreIndex, UserPost } from "./interface";
// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
const post_schema = new mongoose.Schema(
  {
    genesis: {
      type: Number,
      required: true,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      index: true,
      default: "NONE"
    },
    // no filters
    expiry: {
      type: Number,
      required: true,
    },
    cypher_json: {
      type: String,
      required: true
    },
    derivation_scheme: {
      type: String,
      required: true
    },
    edited: {
      type: Boolean,
    }
  },
  {
    strict: true
  }
);
// ------------------ '(◣ ◢)' ---------------------
const postStore = mongoose.model("posts", post_schema);
// ------------------ '(◣ ◢)' ---------------------
export class MongoPostStore implements PostStore {
  async createOne(post: UserPost): Promise<boolean | Error> {
    try {
      await postStore.syncIndexes();
      const doc = await postStore.create(post);
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
  async removeMany(indexes: Array<string>, index_type: PostStoreIndex): Promise<boolean | Error> {
    try {
      const query = (index_type === PostStoreIndex.Owner)
        ? { owner: { $in: indexes } }
        : { $or: [{ id: { $in: indexes } }] };

      const status = await postStore.deleteMany(query)
      if (status instanceof Error) {
        return handleError(status);
      }

      // if (status.deletedCount >= 0) return true;
      return true;
    } catch (e) {
      return handleError(e);
    }
  }
  async removeOne(id: string, owner: string): Promise<boolean | Error> {
    try {
      const id_delete_status = await postStore.deleteOne({ id, owner });
      if (id_delete_status instanceof Error) {
        return handleError(id_delete_status);
      }
      const ref_delete_status = await postStore.deleteMany({ reference: id });
      if (ref_delete_status instanceof Error) {
        return handleError(ref_delete_status);
      }
      return true;
    } catch (e) {
      return handleError(e);
    }
  }
  async readMany(indexes: Array<string>, index_type: PostStoreIndex, genesis_filter: number): Promise<Array<UserPost> | Error> {
    try {
      const query = (index_type === PostStoreIndex.Owner)
        ? { owner: { $in: indexes }, genesis: { "$gte": genesis_filter } }
        : { id: { $in: indexes } , genesis: { "$gte": genesis_filter } };

      const docs = await postStore.find(query).sort({ "genesis": -1 }).exec();
      if (docs instanceof Error) {
        return handleError(docs);
      }
      if (docs.length > 0) {
        const posts = docs.map(doc => {
          return {
            owner: doc["owner"],
            id: doc["id"],
            genesis: doc["genesis"],
            expiry: doc["expiry"],
            reference: doc['reference'] || "NONE",
            cypher_json: doc["cypher_json"],
            derivation_scheme: doc["derivation_scheme"],
            edited: doc["edited"] || false
          }
        });
        return posts;
      } else {
        return [];
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async readAll(genesis_filter: number): Promise<Array<UserPost> | Error> {
    try {
      const docs = await postStore
      .find({ genesis: { "$gte": genesis_filter } })
      .sort({ "genesis": -1 })
      .exec();
      if (docs instanceof Error) {
        return handleError(docs);
      }

      if (docs.length > 0) {
        const posts = docs.map(doc => {
          return {
            owner: doc["owner"],
            id: doc["id"],
            genesis: doc["genesis"],
            expiry: doc["expiry"],
            reference: doc['reference'] || "NONE",
            cypher_json: doc["cypher_json"],
            derivation_scheme: doc["derivation_scheme"],
            edited: doc["edited"] || false
          }
        });
        return posts;
      } else {
        return [];
      }
    } catch (e) {
      return handleError(e);
    }
  }
  async updateOne(id: string, owner: string, cypher_json: string): Promise<boolean | Error> {
    try {
      const q = { id, owner };
      const u = { $set: { cypher_json, edited: true } };
      // console.log({q,u})

      const status = await postStore.updateOne(q, u);
      if (status instanceof Error) {
        return handleError(status);
      };

      return status.modifiedCount > 0;
    } catch (e) {
      return handleError(e);
    }
  }

}
// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------
// ---------------- ┌∩┐(◣_◢)┌∩┐ -----------------
const derivation_schema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
    },    
    last_used: {
      type: String,
      required: true,
    },
  },
  {
    strict: true
  }
);
// ------------------ '(◣ ◢)' ---------------------
const derivationStore = mongoose.model("derivation", derivation_schema);
// ------------------ '(◣ ◢)' ---------------------
export class MongoDerivationStore implements DerivationStore {
  
  async upsertOne(owner: string, derivation_scheme:string): Promise<boolean | Error> {
    try {
      const q = { owner };
      const u = { $set: {  last_used: derivation_scheme } };

      const status = await derivationStore.updateOne(q, u,{upsert: true});
      if (status instanceof Error) {
        return handleError(status);
      };

      return status.modifiedCount > 0;
    } catch (e) {
      return handleError(e);
    }
  }

  async readOne(owner: string): Promise<string | Error> {
    try {
      const query = {owner};

      const doc = await derivationStore.findOne(query).exec();
      if (doc instanceof Error) {
        return handleError(doc);
      }
      else return doc['last_used'];
      
    } catch (e) {
      return handleError(e);
    }
  }
  
  async removeOne(owner: string): Promise<boolean | Error> {
    try {
      const query = {owner};

      const status = await derivationStore.deleteMany(query)
      if (status instanceof Error) {
        return handleError(status);
      }
      return true;
    } catch (e) {
      return handleError(e);
    }
  }

}
// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------

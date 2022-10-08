/*
cypherpost.io
Developed @ Stackmate India
*/

import { handleError } from "../../lib/errors/e";
import { S5UID } from "../../lib/uid/uid";
import { PostInterface, PostStoreIndex, UserPost } from "./interface";
import { MongoPostStore,MongoDerivationStore } from "./mongo";

const postStore = new MongoPostStore();
const derivationStore = new MongoDerivationStore();

const uuid = new S5UID();

export class CypherpostPosts implements PostInterface {
  editOne(id: string, owner: string, cypher_json: string): Promise<boolean | Error> {
    return postStore.updateOne(id, owner, cypher_json);
  }
  async isReference(id: string, owner: string): Promise<boolean | Error>{
    const post = await postStore.readMany([id], PostStoreIndex.PostId, 0);
    if (post instanceof Error) return post;

    if (post.length === 0){
      handleError({
        code: 404,
        message: "Could not find post with this id."
      });
    }

    const is_reference = (post[0].reference !== "NONE" )? false: true;
    return is_reference;

  }
  async findAllByOwner(owner: string, genesis_filter: number): Promise<UserPost[] | Error> {
    return postStore.readMany([owner], PostStoreIndex.Owner, genesis_filter);
  }

  async create(
    owner: string,
    expiry: number,
    cypher_json: string,
    derivation_scheme: string,
    reference: string
  ): Promise<string | Error> {
    const post: UserPost = {
      genesis: Date.now(),
      id: uuid.createPostCode(),
      owner,
      expiry,
      cypher_json,
      derivation_scheme,
      reference: reference || "NONE",
      edited: false,
    }

    const status = await postStore.createOne(post);
    if (status instanceof Error) return status;

    const update_status = await derivationStore.upsertOne(owner,derivation_scheme);
    if (update_status instanceof Error) return update_status;

    return post.id;
  }
  async findManyById(ids: Array<string>, genesis_filter): Promise<Array<UserPost> | Error> {
    return postStore.readMany(ids, PostStoreIndex.PostId, genesis_filter);
  }
  async removeOneById(id: string, owner: string): Promise<boolean | Error> {
    return postStore.removeOne(id, owner);
  }
  async removeManyById(ids: string[]): Promise<boolean | Error> {
    return postStore.removeMany([...ids], PostStoreIndex.PostId);
  }
  async removeAllByOwner(owner: string): Promise<Array<string> | Error> {
    const user_posts = await postStore.readMany([owner], PostStoreIndex.Owner, 0);
    if (user_posts instanceof Error) return user_posts;

    const status = await postStore.removeMany([owner], PostStoreIndex.Owner);
    if (status instanceof Error) return status;

    return user_posts.map(post => post.id);
  }
  async removeAllExpiredByOwner(owner: string): Promise<Array<string> | Error> {
    try {
      const user_posts = await postStore.readMany([owner], PostStoreIndex.Owner, 0);
      if (user_posts instanceof Error) return user_posts;
      const expired_ids = [];

      user_posts.filter((post) => {
        if (post.expiry < Date.now() && post.expiry !== 0)
          expired_ids.push(post.id);
      });

      if (expired_ids.length === 0) return [];
      else {
        const status = await postStore.removeMany([...expired_ids], PostStoreIndex.PostId);
        if (status instanceof Error) return status;
        else return expired_ids;
      }
    }
    catch (e) {
      // console.error({ e });
      return handleError(e)
    }
  }
  async removeAllExpired(): Promise<Array<string> | Error> {
    try {
      const user_posts = await postStore.readAll(0);
      if (user_posts instanceof Error) return user_posts;
      const expired_ids = [];

      user_posts.filter((post) => {
        if (post.expiry < Date.now() && post.expiry !== 0)
          expired_ids.push(post.id);
      });

      if (expired_ids.length === 0) return [];
      else {
        const status = await postStore.removeMany([...expired_ids], PostStoreIndex.PostId);
        if (status instanceof Error) return status;
        else return expired_ids;
      }
    }
    catch (e) {
      // console.error({ e });
      return handleError(e)
    }
  }
  async getLastDerivationScheme(owner: string): Promise<string | Error> {
    return derivationStore.readOne(owner);
  }
}
/*
cypherpost.io
Developed @ Stackmate India
*/
import { r_500 } from "../../lib/logger/winston";
import { filterError, parseRequest, respond } from "../../lib/http/handler";
import { CypherpostIdentity } from "../identity/identity";
import { PostKeyStoreUpdate } from "./keys/interface";
import { CypherpostPostKeys } from "./keys/post_keys";
import { CypherpostPosts } from "./posts";
const { validationResult } = require('express-validator');
import * as WebSocket from 'ws';

const posts = new CypherpostPosts();
const identity = new CypherpostIdentity();
const postKeys = new CypherpostPostKeys();

export async function postMiddleware(req, res, next) {
  const request = parseRequest(req);
  try {
    const signature = request.headers['x-client-signature'];
    const pubkey = request.headers['x-client-pubkey'];
    // CHECK SIG AND PUBKEY FORMAT - RETURNS 500 IF NOT VALID
    const nonce = request.headers['x-nonce'];
    const method = request.method;
    const resource = request.resource;
    const message = `${method} ${resource} ${nonce}`;
    // console.log({resource});
    if(resource === '/api/v2/post/key/stream') next();
    else{
      const status = await identity.authenticate(pubkey, message, signature);
      if (status instanceof Error) {
        throw status;
      }
      else next();
    }
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleCreatePost(req, res) {
  const request = parseRequest(req);

  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    const id = await posts.create(req.headers['x-client-pubkey'], req.body.expiry, req.body.cypher_json, req.body.derivation_scheme, req.body.reference);
    if (id instanceof Error) throw id;

    const response = {
      id
    };
    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleGetMyPosts(req, res) {
  const request = parseRequest(req);
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    const ids_removed = await posts.removeAllExpiredByOwner(req.headers['x-client-pubkey']);
    if (ids_removed instanceof Error) throw ids_removed;

    if (ids_removed.length > 0)
      ids_removed.map((id) => {
        const status = postKeys.removePostDecryptionKeyById(req.headers['x-client-pubkey'], id);
        if (status instanceof Error) {
          console.error("ERRORED WHILE DELETING EXPIRED POST KEYS", { status });
          throw status
        };
      });

    const genesis_filter = request.query['genesis_filter'] ? request.query['genesis_filter'] : 0;

    const my_posts = await posts.findAllByOwner(req.headers['x-client-pubkey'], genesis_filter);
    if (my_posts instanceof Error) throw my_posts;

    const response = {
      posts: my_posts
    };
    respond(200, response, res, request);

  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleGetOthersPosts(req, res) {
  const request = parseRequest(req);
  try {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    const genesis_filter = request.query['genesis_filter'] ? request.query['genesis_filter'] : 0;

    const receiver_keys = await postKeys.findPostDecryptionKeyByReceiver(req.headers['x-client-pubkey'], genesis_filter);
    if (receiver_keys instanceof Error) throw receiver_keys;

    const posts_recieved = await posts.findManyById(receiver_keys.map(key => key.post_id), genesis_filter);
    if (posts_recieved instanceof Error) throw posts_recieved;
    const expired_ids = [];

    posts_recieved.map(post => {
      if (post.expiry < Date.now() && post.expiry !== 0)
        expired_ids.push(post.id);
    });

    const ids_removed = await posts.removeManyById(expired_ids);
    if (ids_removed instanceof Error) throw ids_removed;

    if (expired_ids.length > 0)
      expired_ids.map((id) => {
        const status = postKeys.removePostDecryptionKeyById(req.headers['x-client-pubkey'], id);
        if (status instanceof Error) {
          console.error("ERRORED WHILE DELETING EXPIRED POST KEYS", { status });
          throw status
        };
      });

    const posts_and_keys = [];

    posts_recieved.filter(function (post) {
      const key = receiver_keys.find(receiverKey => receiverKey.post_id === post.id);
      if (key) posts_and_keys.push({ ...post, decryption_key: key.decryption_key });
    });

    const response = {
      posts: posts_and_keys,
    };

    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}


export async function handleGetPostAndKeysById(req, res) {
  const request = parseRequest(req);
  try {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    const dec_keys = await postKeys.findPostDecryptionKeyById(req.params.id);
    if (dec_keys instanceof Error) throw dec_keys;

    const single_post_vec = await posts.findManyById([req.params.id],0);
    if (single_post_vec instanceof Error) throw single_post_vec;

    if (single_post_vec[0].owner == request.headers['x-client-pubkey']){
      const response = {
        post: single_post_vec[0]
      };
      respond(200, response, res, request);
    }

    else{
      let single_dec_key = dec_keys.find(receiverKey => receiverKey.receiver === request.headers['x-client-pubkey']);

      const response = {
        post: { ...single_post_vec[0], decryption_keys: single_dec_key.decryption_key },
      };

      respond(200, response, res, request);
    }
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleDeletePostAndReferenceKeys(req, res) {
  const request = parseRequest(req);
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    let status = await posts.removeOneById(req.params.id, request.headers['x-client-pubkey']);
    if (status instanceof Error) throw status;

    status = await postKeys.removePostDecryptionKeyById(request.headers['x-client-pubkey'], req.params.id);
    if (status instanceof Error) throw status;

    const response = {
      status
    };
    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handlePutKeys(req, res) {
  const request = parseRequest(req);
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }
    // check if giver is TRUSTED, or if receiver is OPEN
    // let is_reference = await posts.isReference(req.body.post_id,request.headers['x-client-pubkey']);
    // if(is_reference instanceof Error) throw is_reference;
    // if(is_reference){
    //   throw {
    //     code: 400,
    //     message: "This post is a reference. You cannot post keys for it. Use the reference primary_key to encrypt it."
    //   }
    // }

    const decryption_keys: PostKeyStoreUpdate[] = request.body.decryption_keys.map((key) => {
      return {
        decryption_key: key['decryption_key'],
        receiver: key['receiver']
      }
    });

    const status = await postKeys.addPostDecryptionKeys(request.headers['x-client-pubkey'], req.body.post_id, decryption_keys);
    if (status instanceof Error) throw status;

    const response = {
      status
    };
    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}


export async function handleEditPost(req, res) {
  const request = parseRequest(req);
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    const status = await posts.editOne(req.body.post_id, request.headers['x-client-pubkey'], req.body.cypher_json);
    if (status instanceof Error) throw status;

    const response = {
      status
    };
    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

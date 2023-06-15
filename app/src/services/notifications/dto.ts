/*
cypherpost.io
Developed @ Stackmate India
*/
import {  parseRequest } from "../../lib/http/handler";
import { CypherpostIdentity } from "../identity/identity";
import {  WebSocket } from 'ws';
import * as http from 'http';
import { handleError } from "../../lib/errors/e";
import { CypherpostPosts } from "../posts/posts";
import { CypherpostPostKeys } from "../posts/keys/post_keys";

const identity = new CypherpostIdentity();
const posts = new CypherpostPosts();
const postKeys = new CypherpostPostKeys();

export async function notifyAuthMiddleware(req: http.IncomingMessage,ws: WebSocket): Promise<boolean | Error> {
  const request = parseRequest(req);
  try {
    const signature = request.headers['x-client-signature'];
    if (signature == undefined || signature == "" || signature == null) 
    throw{
      code: 401,
      message: "Request Signature Required."
    };
    const pubkey = request.headers['x-client-pubkey'];
    // CHECK SIG AND PUBKEY FORMAT - RETURNS 500 IF NOT VALID
    const nonce = request.headers['x-nonce'];
    const method = request.method;
    const resource = "/api/v3/notifications";
    const message = `${method} ${resource} ${nonce}`;
    console.log(message);
    const status = await identity.authenticate(pubkey, message, signature);
    console.log(status)
    return status;
  }
  catch (e) {
    ws.terminate();
  }
}

export async function getPostIdRecipients(post_id: string): Promise<string[] | Error>{
  try{
    const decryption_keys = await postKeys.findPostDecryptionKeyById(post_id);
    if(decryption_keys instanceof Error) return decryption_keys;
    const pubkeys = decryption_keys.map(keys=>{
      return keys.receiver;
    });
    return pubkeys;
  }
  catch(e){
    return handleError(e);
  }
}

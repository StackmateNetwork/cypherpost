/*
cypherpost.io
Developed @ Stackmate India
*/
import { CypherpostBitcoinOps } from "../../lib/bitcoin/bitcoin";
import { r_500 } from "../../lib/logger/winston";
import { filterError, parseRequest, respond } from "../../lib/http/handler";
import { CypherpostAnnouncements } from "../announcements/announcements";
import { CypherpostPostKeys } from "../posts/keys/post_keys";
import { CypherpostPosts } from "../posts/posts";
import { CypherpostIdentity } from "./identity";
import { RegistrationType } from "./interface";

import {S5UID} from "../../lib/uid/uid";
const { validationResult } = require('express-validator');

const TYPE = process.env.TYPE;
const INVITE_SECRET = process.env.SECRET;

const identity = new CypherpostIdentity();
const badges = new CypherpostAnnouncements();
const posts = new CypherpostPosts();
const posts_keys = new CypherpostPostKeys();
const bitcoin = new CypherpostBitcoinOps();
const uid = new S5UID();
export async function identityMiddleware(req, res, next) {
  const request = parseRequest(req);
  try {
    const signature = request.headers['x-client-signature'];
    const pubkey = request.headers['x-client-pubkey'];
    // CHECK SIG AND PUBKEY FORMAT - RETURNS 500 IF NOT VALID

    const nonce = request.headers['x-nonce'];
    const method = request.method;
    const resource = request.resource;
    const message = `${method} ${resource} ${nonce}`;
    if (resource !== "/api/v2/identity/admin/invitation")
    {
      const verified = await bitcoin.verify(message, signature, pubkey);
      if (verified instanceof Error) throw verified;
      else if (!verified) throw{
        code: 401,
        message: "Invalid Request Signature."
      };
    }
    next();
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleRegistration(req, res) {
  const request = parseRequest(req);
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    const registration_type = TYPE.toLowerCase().includes("pub") ?
      RegistrationType.Payment : RegistrationType.Invite;

    const pubkey = request.headers['x-client-pubkey'];
    const invite_code = request.headers['x-client-invite-code']
    const status = await identity.register(request.body.username, pubkey, registration_type,(registration_type===RegistrationType.Invite)?invite_code:"");
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

export async function handleGetAllIdentities(req, res) {
  const request = parseRequest(req);

  try {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    const genesis_filter = request.query['genesis_filter']?request.query['genesis_filter']:0;
    const identities = await identity.all(genesis_filter);
    if (identities instanceof Error) throw identities;

    const response = {
      identities
    };

    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleDeleteIdentity(req, res) {
  const request = parseRequest(req);
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    const rm_posts = await posts.removeAllByOwner(request.headers['x-client-pubkey']);
    if(rm_posts instanceof Error) throw rm_posts;

    const rm_post_keys = await posts_keys.removeAllPostDecryptionKeyOfUser(request.headers['x-client-pubkey']);
    if (rm_post_keys instanceof Error) throw rm_post_keys;

    const rm_badges = await badges.removeAllOfUser(request.headers['x-client-pubkey'])
    if (rm_badges instanceof Error) throw rm_badges;

    const rm_identity = await identity.remove(request.headers['x-client-pubkey']);
    if (rm_identity instanceof Error) throw rm_identity;

    const response = {
      status: true
    };

    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleGetServerIdentity(req, res) {
  const request = parseRequest(req);
  try {
    const response = {
      type: TYPE,
      name: process.env.SERVER_NAME,
      pubkey: process.env.SERVER_PUBKEY,
    };

    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleAdminGetInvite(req,res){
  const request = parseRequest(req);
  try {
    if (request.headers['x-admin-invite-secret'] !== INVITE_SECRET){
      throw {
        code: 401,
        message: "Incorrect Invite Secret"
      }
    }
    const invite_code = await identity.createInvite();
    if(invite_code instanceof Error) throw invite_code;

    const response = {
      invite_code
    }
    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

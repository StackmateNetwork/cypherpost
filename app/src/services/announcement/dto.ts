/*
cypherpost.io
Developed @ Stackmate India
*/
import { r_500 } from "../../lib/logger/winston";
import { filterError, parseRequest, respond } from "../../lib/server/handler";
import { CypherpostIdentity } from "../identity/identity";
import { CypherpostPostKeys } from "../posts/keys/post_keys";
import { CypherpostAnnouncements } from "./announcement";
import { AnnouncementType } from "./interface";

const { validationResult } = require('express-validator');

const identity = new CypherpostIdentity();
const announcements = new CypherpostAnnouncements();
const postKeys = new CypherpostPostKeys();

export async function announcementsMiddleware(req, res, next) {
  const request = parseRequest(req);
  try {
    const signature = request.headers['x-client-signature'];
    const pubkey = request.headers['x-client-pubkey'];
    // CHECK SIG AND PUBKEY FORMAT - RETURNS 500 IF NOT VALID
    const nonce = request.headers['x-nonce'];
    const method = request.method;
    const resource = request.resource;
    const body = JSON.stringify(request.body);
    const message = `${method} ${resource} ${body} ${nonce}`;


    const status = await identity.authenticate(pubkey, message, signature);
    if (status instanceof Error) throw status;
    else next();
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleGetMyAnnouncements(req, res) {
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

    const given = await announcements.findByMaker(request.headers['x-client-pubkey'], genesis_filter);
    if (given instanceof Error) throw given;
    const recieved = await announcements.findByReciever(request.headers['x-client-pubkey'], genesis_filter);
    if (recieved instanceof Error) throw recieved;

    const response = {
      given,
      recieved
    };

    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleGetAllAnnouncements(req, res) {
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

    const result = await announcements.getAll(genesis_filter);
    if (result instanceof Error) throw result;

    const response = {
      announcements: result,
    };

    respond(200, response, res, request);
  }
  catch (e) {
    const result = filterError(e, r_500, request);
    respond(result.code, result.message, res, request);
  }
}

export async function handleMakeAnnouncement(req, res) {
  const request = parseRequest(req);
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }
    if (request.headers['x-client-signature'] === request.body.trusting) {
      throw {
        code: 400,
        message: "Trust in self implied."
      }
    }
    let announcement= AnnouncementType.Trusted;

    switch (request.params.announcement.toUpperCase()){
      case 'TRUST': 
        announcement = AnnouncementType.Trusted;
        break;
      case 'SCAMMER':
        announcement = AnnouncementType.Scammer;
        break;
      case 'BUY':
        announcement= AnnouncementType.Buy;
        break;
        case "SELL":
          announcement= AnnouncementType.Sell;
          break;
      default:
        announcement = AnnouncementType.Trusted;
        break;  
    }

    let status = await announcements.create(request.headers['x-client-pubkey'], request.body.recipient, AnnouncementType.Trusted, request.body.nonce, request.body.signature);
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

export async function handleRevokeTrust(req, res) {
  const request = parseRequest(req);
  try {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw {
        code: 400,
        message: errors.array()
      }
    }

    let status = await announcements.revoke(request.headers['x-client-pubkey'], request.body.revoking, AnnouncementType.Trusted);
    if (status instanceof Error) throw status;
    // REMOVE ALL RELATED KEYS
    status = await postKeys.removePostDecryptionKeyByReciever(request.headers['x-client-pubkey'],request.body.revoking);
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
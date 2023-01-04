/*
cypherpost.io
Developed @ Stackmate India
*/
import { r_500 } from "../../lib/logger/winston";
import { filterError, parseRequest, respond } from "../../lib/http/handler";
import { CypherpostIdentity } from "../identity/identity";
import { CypherpostPostKeys } from "../posts/keys/post_keys";
import { CypherpostAnnouncements } from "./announcements";
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
    const resource = request.resource.split('?')[0];
    const message = `${method} ${resource} ${nonce}`;
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

    const made = await announcements.findByMaker(request.headers['x-client-pubkey'], genesis_filter);
    if (made instanceof Error) throw made;
    const received = await announcements.findByReceiver(request.headers['x-client-pubkey'], genesis_filter);
    if (received instanceof Error) throw received;

    const response = {
      made,
      received
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
    let announcement= AnnouncementType.Trust;

    switch (request.params.announcement.toUpperCase()){
      case 'TRUST':
        announcement = AnnouncementType.Trust;
        break;
      case 'SCAM':
        announcement = AnnouncementType.Scam;
        break;
      case 'ESCROW':
        announcement= AnnouncementType.Escrow;
        break;
      default:
        announcement = AnnouncementType.Trust;
        break;
    }

    const status = await announcements.create(request.headers['x-client-pubkey'], request.body.recipient, AnnouncementType.Trust, request.body.nonce, request.body.signature);
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

    let status = await announcements.revoke(request.headers['x-client-pubkey'], request.body.revoking, AnnouncementType.Trust);
    if (status instanceof Error) throw status;
    // REMOVE ALL RELATED KEYS
    let altstatus = await postKeys.removePostDecryptionKeyByReceiver(request.headers['x-client-pubkey'],request.body.revoking);
    if (altstatus instanceof Error) throw altstatus;

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

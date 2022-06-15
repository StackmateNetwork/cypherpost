/*
cypherpost.io
Developed @ Stackmate India
*/
import { r_500 } from "../../lib/logger/winston";
import { filterError, parseRequest, respond } from "../../lib/http/handler";
import { CypherpostIdentity } from "../identity/identity";
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import { handleError } from "../../lib/errors/e";

const { validationResult } = require('express-validator');

const identity = new CypherpostIdentity();

export async function notifyAuthMiddleware(req: http.IncomingMessage,ws: WebSocket): Promise<boolean | Error> {
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

    // const status = await identity.authenticate(pubkey, message, signature);
    return true;
  }
  catch (e) {
    ws.terminate();
  }
}
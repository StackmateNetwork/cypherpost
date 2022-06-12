/**
 * sushi
 * arrange super clinic creek twenty joke gossip order type century photo ahead
 */
const crypto = require("crypto");
const store = require('./store');
const keynos = require("./keys");
const { request } = require('./request');

const VERSION_PREFIX = "/api/v2";
const api_url = ((document.domain === 'localhost') ? "http://localhost" : `https://cypherpost.io`) + VERSION_PREFIX;

const TEST_INVITE_CODE="";

function createRequestHeaders(identity_parent, nonce, signature, invite_code) {
  // console.log({
  //   "x-client-pubkey": identity_parent['pubkey'],
  //   "x-nonce": nonce,
  //   "x-client-signature": signature,
  //   "x-client-invite-code": invite_code? invite_code : TEST_INVITE_CODE
  // })
  return {
    "x-client-pubkey": identity_parent['pubkey'],
    "x-nonce": nonce,
    "x-client-signature": signature,
    "x-client-invite-code": invite_code? invite_code : TEST_INVITE_CODE
  };

}

async function createRequestSignature(method, resource, body, identity_parent, nonce) {
  const request_message = `${method} ${VERSION_PREFIX}${resource} ${JSON.stringify(body)} ${nonce}`;
  console.log({ request_message })
  return await keynos.schnorrSign(request_message, identity_parent.privkey);
};

async function createAnnouncementSignature(identity_parent, reciever_pubkey, type, nonce) {
  const announcement_message = `${identity_parent.pubkey}:${reciever_pubkey}:${type}:${nonce}`;
  console.log({ announcement_message })
  return await keynos.schnorrSign(announcement_message, identity_parent.privkey);
}
async function getServerIdentity(identity_parent) {

  const nonce = Date.now();
  const resource = "/identity/server";
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;

}

async function registerIdentity(identity_parent, username, invite_code) {
  const nonce = Date.now();
  const resource = "/identity";
  const url = api_url + resource;
  const method = "POST";
  const body = {
    username
  };

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature, invite_code);

  console.log({ headers, body, signature });
  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.status;
}
async function getAllIdentities(identity_parent) {
  const existing = store.getIdentities();
  console.log({existing})
  const genesis_filter =  (existing.length>0)
  ?existing.pop().genesis
  :0;

  const nonce = Date.now();
  const resource = "/identity/all?genesis_filter="+genesis_filter;
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  console.log({headers});
  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.identities;

}
async function deleteMyIdentity(identity_parent) {
  const nonce = Date.now();
  const resource = "/identity";
  const url = api_url + resource;
  const method = "DELETE";
  const body = {};

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.status;

}
async function getAllAnnouncements(identity_parent) {
  const existing = store.getAllAnnouncements();
  const genesis_filter =  (existing.length>0)
  ?existing.pop().genesis
  :0;
  const nonce = Date.now();
  const resource = "/announcement/all?genesis_filter=" + genesis_filter;
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.announcements;
}
async function getMyAnnouncements(identity_parent){
  
  const existing = store.getMyAnnouncements();
  const genesis_filter =  (existing.length>0)
  ?existing.pop().genesis
  :0;
  const nonce = Date.now();
  const resource = "/announcement/self?genesis_filter="+genesis_filter;
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}

async function makeAnnouncement(identity_parent, reciever, announcement_type) {
  let nonce = Date.now();
  const announcement_signature = await createAnnouncementSignature(identity_parent, reciever, announcement_type.toUpperCase(), nonce);
  const resource = "/announcement/" + announcement_type.toLowerCase();
  const url = api_url + resource;
  const method = "POST";

  const body = {
    recipient: reciever,
    nonce,
    signature: announcement_signature
  };

  console.log({body});
  nonce = Date.now();
  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.status;
}

async function revokeAnnouncement(identity_parent, reciever, announcement_type) {
  let nonce = Date.now();
  const resource = "/announcement/" + announcement_type.toLowerCase() + "/revoke";
  const url = api_url + resource;
  const method = "POST";

  const body = {
    revoking: reciever,
  };

  console.log({body});
  nonce = Date.now();
  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.status;
}


async function createPost(identity_parent, cypher_json, derivation_scheme, expiry, reference) {
  const nonce = Date.now();
  const resource = "/posts";
  const url = api_url + resource;
  const method = "PUT";
  const body = {
    cypher_json,
    derivation_scheme,
    expiry,
    reference
  };

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  // console.log({headers,body,signature});
  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.id;
}
async function setPostVisibility(identity_parent, post_id, decryption_keys) {
  const nonce = Date.now();
  const resource = "/posts/keys";
  const url = api_url + resource;
  const method = "PUT";
  const body = {
    post_id,
    decryption_keys
  };

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.status;
}
async function getMyPosts(identity_parent) {
  const existing = store.getMyTrades();
  const genesis_filter =  (existing.length>0)
  ?existing.pop().genesis
  :0;
  const nonce = Date.now();
  const resource = "/posts/self?genesis_filter="+genesis_filter;
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.posts;
}
async function getPostsForMe(identity_parent) {
  const existing = store.getOthersTrades();
  const genesis_filter =  (existing.length>0)
  ?existing.pop().genesis
  :0;

  const nonce = Date.now();
  const resource = "/posts/others?genesis_filter="+genesis_filter;
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = await createRequestSignature(method, resource, body, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response.posts;
}
async function deletePost(identity_parent, post_id) {
  const nonce = Date.now();
  const resource = "/posts/" + post_id;
  const url = api_url + resource;
  const method = "DELETE";

  const signature = await createRequestSignature(method, resource, {}, identity_parent, nonce);
  const headers = createRequestHeaders(identity_parent, nonce, signature);

  console.log({method,url,headers});
  const response = await request(method, url, headers, {});
  if (response instanceof Error) return response;

  return response.status;
}


module.exports = {
  getServerIdentity,
  registerIdentity,
  getAllIdentities,
  getMyPosts,
  getPostsForMe,
  getAllAnnouncements,
  makeAnnouncement,
  deleteMyIdentity,
  createPost,
  setPostVisibility,
  deletePost,
  getMyAnnouncements,
  revokeAnnouncement,
}
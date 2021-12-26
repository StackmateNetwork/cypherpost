/**
 * sushi
 * arrange super clinic creek twenty joke gossip order type century photo ahead
 */
const crypto = require("crypto");
const store = require('./store');
const bitcoin = require("./bitcoin");
const { request } = require('./request');

const RESOURCE_PREFIX = "/api/v2";
const api_url = (document.domain === 'localhost') ? "http://localhost/api/v2" : `https://cypherpost.io/api/v2`;
const web_url = (document.domain === 'localhost') ? "http://localhost" : `https://cypherpost.io`;

function createRequestSignature(method,resource,body,identity_parent,nonce){
  const message = `${method} ${RESOURCE_PREFIX}${resource} ${JSON.stringify(body)} ${nonce}`;
  const ecdsa_keys = bitcoin.extract_ecdsa_pair(identity_parent);
  console.log({message})
  return bitcoin.sign(message,ecdsa_keys.private_key);
};

function createRequestHeaders(identity_parent,nonce,signature){
  return {
    "x-client-xpub": identity_parent['xpub'],
    "x-nonce": nonce,
    "x-client-signature": signature,
  };
}

async function apiIdentityRegistration(identity_parent,username){
  const nonce = Date.now();
  const resource = "/identity";
  const url = api_url + resource;
  const method = "POST";
  const body = {
    username
  };

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  console.log({headers,body,signature});
  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}

async function apiIdentityAll(identity_parent){
  const nonce = Date.now();
  const resource = "/identity/all";
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;

}

async function apiGetProfileSelf(identity_parent){
  const nonce = Date.now();
  const resource = "/profile/self";
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}
async function apiUpdateProfile(identity_parent,cypher_json,derivation_scheme){
  const nonce = Date.now();
  const resource = "/profile";
  const url = api_url + resource;
  const method = "POST";
  const body = {
    cypher_json,
    derivation_scheme,
  };

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}
async function apiUpdateProfileKeys(identity_parent,decryption_keys){
  const nonce = Date.now();
  const resource = "/profile/keys";
  const url = api_url + resource;
  const method = "POST";
  const body = {
    decryption_keys
  };

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}
async function apiAllBadges(identity_parent){
  const nonce = Date.now();
  const resource = "/badges/all";
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}

async function apiProfileOthers(identity_parent){
  const nonce = Date.now();
  const resource = "/profile/others";
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}
async function apiGetPreferences(identity_parent){
  const nonce = Date.now();
  const resource = "/preference";
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}
async function apiGetPostsSelf(identity_parent){
  const nonce = Date.now();
  const resource = "/posts/self";
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}
async function apiGetPostsOthers(identity_parent){
  const nonce = Date.now();
  const resource = "/posts/others";
  const url = api_url + resource;
  const method = "GET";
  const body = {};

  const signature = createRequestSignature(method,resource,body,identity_parent,nonce);
  const headers = createRequestHeaders(identity_parent,nonce,signature);

  const response = await request(method, url, headers, body);
  if (response instanceof Error) return response;

  return response;
}

module.exports = {
  apiIdentityRegistration,
  apiIdentityAll,
  apiUpdateProfile,
  apiPreferences: apiGetPreferences,
  apiProfileSelf: apiGetProfileSelf,
  apiProfileOthers,
  apiPostsSelf: apiGetPostsSelf,
  apiPostsOthers: apiGetPostsOthers,
  apiAllBadges,
}
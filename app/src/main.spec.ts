/*
cypherpost.io
Developed @ Stackmate India
*/
// IMPORTS
import chai from "chai";
import chaiHttp from "chai-http";
import * as crypto from "crypto";
import "mocha";
import { CypherpostBitcoinOps } from "./lib/bitcoin/bitcoin";
import { ExtendedKeys } from "./lib/bitcoin/interface";
import { S5Crypto } from "./lib/crypto/crypto";
import { handleError } from "./lib/errors/e";
import { logger } from "./lib/logger/winston";
import * as express from "./server";
import { DbConnection } from "./lib/storage/interface";
import { MongoDatabase } from "./lib/storage/mongo";
import { CypherpostAnnouncements } from "./services/announcements/announcements";
import { AnnouncementType } from "./services/announcements/interface";
import { CypherpostIdentity } from "./services/identity/identity";
import { CypherpostPostKeys } from "./services/posts/keys/post_keys";
import { CypherpostPosts } from "./services/posts/posts";
import { truncateSync } from "fs";

const sinon = require('sinon');
import WebSocket, { createWebSocketStream } from 'ws';

const bitcoin = new CypherpostBitcoinOps();
const s5crypto = new S5Crypto();
const identity = new CypherpostIdentity();
const announcements = new CypherpostAnnouncements();
const posts = new CypherpostPosts();
const post_keys = new CypherpostPostKeys();
const db = new MongoDatabase();
const invite_secret = "098f6bcd4621d373cade4e832627b4f6";
let a_invitation;
let b_invitation;
let c_invitation;
let server;
const TEST_PORT = "13021";
const should = chai.should();
const expect = chai.expect;
chai.use(chaiHttp);
// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------
/**
 * Create identities A B C
 * -t> represents trusted announcement
 * A -t> B -t> C
 * A allows entire trusted chain (B & C) to view profile and posts
 * A also trusts C
 * A revokes trust in B => A's profile and posts are only visible to C
 * C trusts A => A can view C's profile and posts
 * A deletes their identity
 */

enum PostType {
  Profile = "Profile",
  Ad = "Ad",
  Preferences = "Preferences"
}

interface Profile {
  type: PostType,
  nickname: string,
  status: string,
  contact: string
};
interface TestProfileSet {
  plain: Profile,
  cypher: string,
  encryption_key: string
};

enum OrderType {
  Buy = "Buy",
  Sell = "Sell"
}
enum BitcoinNetwork {
  OnChain = "OnChain",
  Lightning = "Lightning",
  Liquid = "Liquid"
}
enum FiatCurrency {
  INR = "INR",
  CAD = "CAD",
  AUD = "AUD",
  USD = "USD",
  EUR = "EUR"
}

enum PaymentMethod {
  UPI = "UPI",
  IMPS = "IMPS",
  Cash = "Cash",
  Aangadiya = "Aangadiya",
  Cheque = "Cheque",
  Paypal = "Paypal"
}

enum RateType {
  Fixed = "Fixed",
  Variable = "Variable"
}

enum ReferenceExchange {
  LocalBicoins = "LocalBitcoins",
  BullBitcoin = "BullBitcoin",
  WazirX = "WazirX",
  Kraken = "Kraken",
  BitFinex = "Bitfinex",
  None = "None"
}

interface Post {
  type: PostType,
  order: OrderType,
  message: string,
  network: BitcoinNetwork,
  minimum: number,
  maximum: number,
  fiat_currency: FiatCurrency,
  payment_method: PaymentMethod,
  rate_type: RateType,
  fixed_rate: number,
  reference_exchange: ReferenceExchange,
  reference_percent: number
}

interface TestPostSet {
  plain: Post,
  cypher: string,
  encryption_key: string,
  post_id: string;
}

interface TestKeySet {
  mnemonic: string,
  root_xprv: string,
  cypherpost_parent: ExtendedKeys,
  identity_xpub: string;
  identity_private: string;
  identity_pubkey: string;
};

const init_identity_ds = "m/0h/0h/0h";
const init_profile_ds = "m/1h/0h/0h";
const init_preferences_ds = "m/2h/0h/0h"
const init_posts_ds = "m/3h/0h/0h";
const trusted_announcement = AnnouncementType.Trusted;

let a_key_set: TestKeySet;
let b_key_set: TestKeySet;
let c_key_set: TestKeySet;

let a_profile_set: TestProfileSet;
let b_profile_set: TestProfileSet;
let c_profile_set: TestProfileSet;

let a_post_set: TestPostSet;
let b_post_set: TestPostSet;
let c_post_set: TestPostSet;
let c_post_edit_set: TestPostSet;

let endpoint;
let body;
let nonce = Date.now();
let request_signature;

let all_identities;
let all_announcements;

let a_trust = [];
let b_trust = [];
let c_trust = [];

let a_preferences = {
  muted: [],
};
let cypher_preference;

let b_post_to_notify_a;
// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------
// ------------------ INITIALIZERS ------------------
async function createTestKeySet(): Promise<TestKeySet | Error> {
  try {
    const mnemonic = bitcoin.generate_mnemonic();
    if (mnemonic instanceof Error) throw mnemonic;
    const root_xprv = await bitcoin.seed_root(mnemonic);
    if (root_xprv instanceof Error) throw root_xprv;
    const cypherpost_parent = bitcoin.derive_parent_128(root_xprv);
    if (cypherpost_parent instanceof Error) throw cypherpost_parent;
    const identity_parent = await bitcoin.derive_hardened_str(cypherpost_parent.xprv, init_identity_ds);
    if (identity_parent instanceof Error) throw identity_parent;
    const identity_ecdsa = await bitcoin.extract_ecdsa_pair(identity_parent);
    if (identity_ecdsa instanceof Error) throw identity_ecdsa;

    const set: TestKeySet = {
      mnemonic,
      root_xprv,
      cypherpost_parent,
      identity_xpub: identity_parent.xpub,
      identity_private: identity_ecdsa.privkey,
      identity_pubkey: identity_ecdsa.pubkey
    };
    return set;
  }
  catch (e) {
    handleError(e);
  }
}

function createProfileSet(plain_profile: Profile, cypherpost_parent: ExtendedKeys, derivation_scheme: string): TestProfileSet {
  const profile_xkey = bitcoin.derive_hardened_str(cypherpost_parent['xprv'], derivation_scheme) as ExtendedKeys;
  const encryption_key = crypto.createHash('sha256').update(profile_xkey['xprv']).digest('hex');
  const cypher = s5crypto.encryptAESMessageWithIV(JSON.stringify(plain_profile), encryption_key) as string;
  return {
    plain: plain_profile,
    cypher,
    encryption_key
  }
}
function createPostSet(plain_post: Post, cypherpost_parent: ExtendedKeys, derivation_scheme: string): TestPostSet {
  const ppost_xkey = bitcoin.derive_hardened_str(cypherpost_parent['xprv'], derivation_scheme) as ExtendedKeys;
  const encryption_key = crypto.createHash('sha256').update(ppost_xkey['xprv']).digest('hex');
  const cypher = s5crypto.encryptAESMessageWithIV(JSON.stringify(plain_post), encryption_key) as string;
  return {
    plain: plain_post,
    cypher,
    encryption_key,
    post_id: "unset"
  }
}
function createDefaultTestPost(type: PostType, order: OrderType, message: string, fixed: boolean): Post {
  return {
    message,
    type,
    order,
    network: BitcoinNetwork.OnChain,
    minimum: 1000,
    maximum: 100000,
    fiat_currency: FiatCurrency.INR,
    payment_method: PaymentMethod.UPI,
    rate_type: RateType.Variable,
    fixed_rate: (fixed) ? 50000000 : 0,
    reference_exchange: (fixed) ? ReferenceExchange.None : ReferenceExchange.WazirX,
    reference_percent: (fixed) ? 0 : 5
  }
}
function adminGetInvitationRequest() {
  const endpoint = "/api/v2/identity/admin/invitation";

  return {
    endpoint,
    invite_secret,
  }
}
async function createIdentityRegistrationRequest(username, key_set: TestKeySet) {
  const endpoint = "/api/v2/identity";
  const body = {
    username,
  };
  const nonce = Date.now();
  const message = `POST ${endpoint} ${JSON.stringify(body)} ${nonce}`;
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;

  return {
    nonce,
    endpoint,
    body,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}
async function createIdentityGetRequest(key_set: TestKeySet) {
  const endpoint = "/api/v2/identity/all";
  const nonce = Date.now();
  const body = {};
  const message = `GET ${endpoint} ${JSON.stringify(body)} ${nonce}`;
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;

  return {
    nonce,
    endpoint,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}
async function createAnnouncementIssueRequest(announcement: AnnouncementType, to_pubkey: string, key_set: TestKeySet) {
  const endpoint = "/api/v2/announcement/trust";
  const nonce = Date.now();

  const announcement_signature = await bitcoin.sign(`${key_set.identity_pubkey}:${to_pubkey}:${announcement.toString()}:${nonce}`, key_set.identity_private) as string;

  const body = {
    recipient: to_pubkey,
    nonce,
    signature: announcement_signature
  };

  const message = `POST ${endpoint} ${JSON.stringify(body)} ${nonce}`;
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;

  return {
    nonce,
    endpoint,
    body,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}

async function createGetAllAnnouncementsRequest(key_set: TestKeySet) {
  const endpoint = "/api/v2/announcement/all";
  const nonce = Date.now();
  const body = {};
  const message = `GET ${endpoint} ${JSON.stringify(body)} ${nonce}`;
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;

  return {
    nonce,
    endpoint,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}
async function createPostRequest(expiry: number, post_set: TestPostSet, key_set: TestKeySet) {
  const endpoint = "/api/v2/post";
  const nonce = Date.now();
  const body = {
    expiry,
    cypher_json: post_set.cypher,
    derivation_scheme: init_posts_ds
  };

  const message = `PUT ${endpoint} ${JSON.stringify(body)} ${nonce}`;
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;

  return {
    nonce,
    endpoint,
    body,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}

async function editPostRequest(post_set: TestPostSet, key_set: TestKeySet) {
  const endpoint = "/api/v2/post/edit";
  const nonce = Date.now();
  const body = {
    post_id: post_set.post_id,
    cypher_json: post_set.cypher,
  };

  const message = `POST ${endpoint} ${JSON.stringify(body)} ${nonce}`;
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;

  return {
    nonce,
    endpoint,
    body,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}
async function createPostsGetSelfRequest(key_set: TestKeySet) {
  const endpoint = "/api/v2/post/self";
  const nonce = Date.now();
  const body = {};

  const message = `GET ${endpoint} ${JSON.stringify(body)} ${nonce}`;
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;

  return {
    nonce,
    endpoint,
    body,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}
async function createPostsGetOthersRequest(key_set: TestKeySet) {
  const endpoint = "/api/v2/post/others";
  const nonce = Date.now();
  const body = {};

  const message = `GET ${endpoint} ${JSON.stringify(body)} ${nonce}`;
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;

  return {
    nonce,
    endpoint,
    body,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}

async function createKeyStoreUpdate(post_set: TestPostSet, trusted_list: string[], key_set: TestKeySet) {
  const endpoint = "/api/v2/post/keys";
  const nonce = Date.now();

  const body = {
    decryption_keys: [],
    post_id: post_set.post_id
  };

  trusted_list.map(async (trusted_pubkey) => {

    const shared_sercret = bitcoin.calculate_shared_secret({
      privkey: key_set.identity_private,
      pubkey: trusted_pubkey
    }) as string;

    const decryption_key = s5crypto.encryptAESMessageWithIV(post_set.encryption_key, shared_sercret);
    const dk_entry = {
      decryption_key,
      receiver: trusted_pubkey
    };
    body.decryption_keys.push(dk_entry);
  });

  const signature = await bitcoin.sign(`PUT ${endpoint} ${JSON.stringify(body)} ${nonce}`, key_set.identity_private);

  // console.log( JSON.stringify({body},null,2))
  return {
    nonce,
    endpoint,
    body,
    signature,
    pubkey: key_set.identity_pubkey
  }
}


async function createRevokeTrustRequest(revoke: string, key_set: TestKeySet) {
  const endpoint = "/api/v2/announcement/trust/revoke";
  const body = {
    revoking: revoke,
  };
  const nonce = Date.now();
  const signature = await bitcoin.sign(`POST ${endpoint} ${JSON.stringify(body)} ${nonce}`, key_set.identity_private);
  return {
    nonce,
    endpoint,
    body,
    signature: signature,
    pubkey: key_set.identity_pubkey
  }
}
async function createDeleteIdentityRequest(key_set: TestKeySet) {
  const endpoint = "/api/v2/identity";
  const nonce = Date.now();
  const body = {};
  const signature = await bitcoin.sign(`DELETE ${endpoint} ${JSON.stringify(body)} ${nonce}`, key_set.identity_private) as string;
  return {
    nonce,
    endpoint,
    signature,
    pubkey: key_set.identity_pubkey
  }
}
async function createServerIdentityRequest(key_set: TestKeySet) {
  const endpoint = "/api/v2/identity/server";
  const nonce = Date.now();
  const body = {};
  const signature = await bitcoin.sign(`GET ${endpoint} ${JSON.stringify(body)} ${nonce}`, key_set.identity_private) as string;
  return {
    nonce,
    endpoint,
    signature,
    pubkey: key_set.identity_pubkey
  }
}

async function createSocketConnectionRequest(key_set: TestKeySet){
  const endpoint = "/api/v3/notifications";
  const nonce = Date.now();
  const body = {};
  const message = `GET ${endpoint} {} ${nonce}`;
  console.log({message})
  const signature = await bitcoin.sign(message, key_set.identity_private) as string;
  return {
    nonce,
    endpoint,
    signature,
    pubkey: key_set.identity_pubkey
  }
}
// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------

describe("CYPHERPOST: API BEHAVIOUR SIMULATION", function () {
  before(async function () {
    const connection: DbConnection = {
      port: process.env.DB_PORT,
      ip: process.env.DB_IP,
      name: process.env.DB_NAME,
      auth: process.env.DB_AUTH,
    };
    sinon.stub(logger, "debug");
    console.log({connection})
    await db.connect(connection);
    server = await express.start(TEST_PORT);
    // ------------------ (◣_◢) ------------------
    a_key_set = await createTestKeySet() as TestKeySet;
    b_key_set = await createTestKeySet() as TestKeySet;
    c_key_set = await createTestKeySet() as TestKeySet;
    // ------------------ (◣_◢) ------------------
    a_profile_set = createProfileSet({
      type: PostType.Profile,
      nickname: "Alice Articulates",
      status: "Sound Money, Sound World.",
      contact: "@alice3us on Telegram"
    }, a_key_set.cypherpost_parent, init_profile_ds);

    b_profile_set = createProfileSet({
      type: PostType.Profile,
      nickname: "Bobby Breeds",
      status: "Making Babies.",
      contact: "@bob3us on Telegram"
    }, b_key_set.cypherpost_parent, init_profile_ds);

    c_profile_set = createProfileSet({
      type: PostType.Profile,
      nickname: "Carol Cares",
      status: "Trying Hard Not To Cry.",
      contact: "@carol3us on Telegram"
    }, c_key_set.cypherpost_parent, init_profile_ds);
    // ------------------ (◣_◢) ------------------
    a_post_set = createPostSet(createDefaultTestPost(PostType.Ad, OrderType.Sell, "Urgent", true), a_key_set.cypherpost_parent, init_posts_ds);
    b_post_set = createPostSet(createDefaultTestPost(PostType.Ad, OrderType.Buy, "Stacking", false), b_key_set.cypherpost_parent, init_posts_ds);
    c_post_set = createPostSet(createDefaultTestPost(PostType.Ad, OrderType.Sell, "Contact me on Signal.", false), c_key_set.cypherpost_parent, init_posts_ds);
    c_post_edit_set = createPostSet(createDefaultTestPost(PostType.Ad, OrderType.Sell, "Contact me on Threema.", false), c_key_set.cypherpost_parent, init_posts_ds);
    // ------------------ (◣_◢) ------------------
  });

  after(async function () {
    await identity.remove(a_key_set.identity_pubkey);
    await identity.remove(b_key_set.identity_pubkey);
    await identity.remove(c_key_set.identity_pubkey);
    await announcements.removeAllOfUser(a_key_set.identity_pubkey);
    await announcements.removeAllOfUser(b_key_set.identity_pubkey);
    await announcements.removeAllOfUser(c_key_set.identity_pubkey);
    await posts.removeAllByOwner(a_key_set.identity_pubkey);
    await posts.removeAllByOwner(b_key_set.identity_pubkey);
    await posts.removeAllByOwner(c_key_set.identity_pubkey);
    await post_keys.removePostDecryptionKeyByGiver(a_key_set.identity_pubkey);
    await post_keys.removePostDecryptionKeyByGiver(b_key_set.identity_pubkey);
    await post_keys.removePostDecryptionKeyByGiver(c_key_set.identity_pubkey);
  });

  describe("ADMIN CREATES INVITE CODES for A B C to register", function () {
    let request_admin;

    it("CREATES REQUEST OBJECTS", async function () {
      request_admin = await adminGetInvitationRequest();
    });

    it("GETS A's INVITATION", function (done) {
      console.log({ request_admin })
      chai
        .request(server)
        .get(request_admin.endpoint)
        .set({
          "x-admin-invite-secret": request_admin.invite_secret
        })
        .end((err, res) => {
          res.should.have.status(200);
          console.log(res.body);
          expect(res.body['invite_code']).to.be.a('string');
          a_invitation = res.body['invite_code']
          done();
        });
    });
    it("GETS B's INVITATION", function (done) {
      // console.log({ request_a })
      chai
        .request(server)
        .get(request_admin.endpoint)
        .set({
          "x-admin-invite-secret": request_admin.invite_secret
        })
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['invite_code']).to.be.a('string');
          b_invitation = res.body['invite_code']
          done();
        });
    });
    it("GETS C's INVITATION", function (done) {
      // console.log({ request_a })
      chai
        .request(server)
        .get(request_admin.endpoint)
        .set({
          "x-admin-invite-secret": request_admin.invite_secret
        })
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['invite_code']).to.be.a('string');
          c_invitation = res.body['invite_code']
          done();
        });
    });


  });

  describe("REGISTER IDENTITIES for A B C and VERIFY REGISTRATION via GET ALL", function () {
    let request_a;
    let request_b;
    let request_c;
    let request_c_get;

    it("CREATES REQUEST OBJECTS", async function () {
      request_a = await createIdentityRegistrationRequest("alice", a_key_set);
      request_b = await createIdentityRegistrationRequest("bob", b_key_set);
      request_c = await createIdentityRegistrationRequest("carol", c_key_set);
      request_c_get = await createIdentityGetRequest(c_key_set);
    });

    it("REGISTERS IDENTITY A", function (done) {
      // console.log({ request_a })
      chai
        .request(server)
        .post(request_a.endpoint)
        .set({
          "x-client-pubkey": request_a.pubkey,
          "x-nonce": request_a.nonce,
          "x-client-signature": request_a.signature,
          "x-client-invite-code": a_invitation
        })
        .send(request_a.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("REGISTERS IDENTITY B", function (done) {
      // console.log({ request_b })

      chai
        .request(server)
        .post(request_b.endpoint)
        .set({
          "x-client-pubkey": request_b.pubkey,
          "x-nonce": request_b.nonce,
          "x-client-signature": request_b.signature,
          "x-client-invite-code": b_invitation
        })
        .send(request_b.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("REGISTERS IDENTITY C", function (done) {
      // console.log({ request_c })

      chai
        .request(server)
        .post(request_c.endpoint)
        .set({
          "x-client-pubkey": request_c.pubkey,
          "x-nonce": request_c.nonce,
          "x-client-signature": request_c.signature,
          "x-client-invite-code": c_invitation
        })
        .send(request_c.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("GETS ALL IDENTITIES as C", function (done) {
      chai
        .request(server)
        .get(request_c_get.endpoint)
        .set({
          "x-client-pubkey": request_c_get.pubkey,
          "x-nonce": request_c_get.nonce,
          "x-client-signature": request_c_get.signature,
        })
        .end((err, res) => {
          res.should.have.status(200);
          all_identities = res.body['identities'];
          let counter = 0;
          // console.log({ all_identities });
          all_identities.map((identity) => {
            if (identity.pubkey === a_key_set.identity_pubkey ||
              identity.pubkey === b_key_set.identity_pubkey ||
              identity.pubkey === c_key_set.identity_pubkey)
              counter++;
          })
          expect(counter).to.equal(3);
          done();
        })
    });
  });

  describe("ISSUE TRUST ANNOUNCEMENT A->B->C and VERIFY via GET ALL", function () {
    let request_a;
    let request_b;
    let request_c;
    // let request_c_get_self;
    let request_c_get_all;

    it("CREATES REQUEST OBJECTS", async function () {
      request_a = await createAnnouncementIssueRequest(AnnouncementType.Trusted, b_key_set.identity_pubkey, a_key_set);
      request_b = await createAnnouncementIssueRequest(AnnouncementType.Trusted, c_key_set.identity_pubkey, b_key_set);
      request_c = await createAnnouncementIssueRequest(AnnouncementType.Trusted, a_key_set.identity_pubkey, c_key_set);
      request_c_get_all = await createGetAllAnnouncementsRequest(c_key_set);
    });

    it("ISSUES TRUST ANNOUNCEMENT A->B", function (done) {
      chai
        .request(server)
        .post(request_a.endpoint)
        .set({
          "x-client-pubkey": request_a.pubkey,
          "x-nonce": request_a.nonce,
          "x-client-signature": request_a.signature,
        })
        .send(request_a.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("ISSUES TRUST ANNOUNCEMENT B->C", function (done) {
      chai
        .request(server)
        .post(request_b.endpoint)
        .set({
          "x-client-pubkey": request_b.pubkey,
          "x-nonce": request_b.nonce,
          "x-client-signature": request_b.signature,
        })
        .send(request_b.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("ISSUES TRUST ANNOUNCEMENT C->A", function (done) {
      chai
        .request(server)
        .post(request_c.endpoint)
        .set({
          "x-client-pubkey": request_c.pubkey,
          "x-nonce": request_c.nonce,
          "x-client-signature": request_c.signature
        })
        .send(request_c.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("GETS ALL ANNOUNCEMENTS as C", function (done) {
      chai
        .request(server)
        .get(request_c_get_all.endpoint)
        .set({
          "x-client-pubkey": request_c_get_all.pubkey,
          "x-nonce": request_c_get_all.nonce,
          "x-client-signature": request_c_get_all.signature,
        })
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['announcements'].length).to.equal(3);
          all_announcements = res.body['announcements'];
          done();
        })
    });
    it("VERIFIES ALL ANNOUNCEMENTS ISSUED and POPULATES EACH USER's TRUSTED", function (done) {
      all_announcements.map(async (announcement) => {
        const message = `${announcement.by}:${announcement.to}:${announcement.type}:${announcement.nonce}`;
        const verify = await bitcoin.verify(message, announcement.signature, announcement.by);
        const failedSig = "Announcement Signature failed.";
        if (!verify) throw failedSig;
        if (announcement.by === a_key_set.identity_pubkey) a_trust.push(announcement.to);
        if (announcement.by === b_key_set.identity_pubkey) b_trust.push(announcement.to);
        if (announcement.by === c_key_set.identity_pubkey) c_trust.push(announcement.to);
      });
      done();
    });
  });

  describe("CREATES POSTS for A, B & C and VERIFY via GET SELF", function () {
    let request_a;
    let request_a0;
    let request_a_get_self;
    let request_b;
    let request_b_get_self;
    let request_c;
    let request_c_get_self;
    let request_c_get_others;

    it("CREATES REQUEST OBJECTS", async function () {
      request_a = await createPostRequest(Date.now() + 10, a_post_set, a_key_set);
      request_a0 = await createPostRequest(Date.now() + 10000, a_post_set, a_key_set);
      request_b = await createPostRequest(Date.now() + 10000, b_post_set, b_key_set);
      request_c = await createPostRequest(Date.now() + 10000, c_post_set, c_key_set);

      request_a_get_self = await createPostsGetSelfRequest(a_key_set);
      request_b_get_self = await createPostsGetSelfRequest(b_key_set);
      request_c_get_self = await createPostsGetSelfRequest(c_key_set);

      request_c_get_others = await createPostsGetOthersRequest(c_key_set);
    });

    it("CREATES POSTS: A - 1 expires", function (done) {
      chai
        .request(server)
        .put(request_a.endpoint)
        .set({
          "x-client-pubkey": request_a.pubkey,
          "x-nonce": request_a.nonce,
          "x-client-signature": request_a.signature,
        })
        .send(request_a.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['id'].startsWith('s5')).to.equal(true);
          done();
        });
    });
    it("CREATES POSTS: A - 1 persists", function (done) {
      chai
        .request(server)
        .put(request_a0.endpoint)
        .set({
          "x-client-pubkey": request_a0.pubkey,
          "x-nonce": request_a0.nonce,
          "x-client-signature": request_a0.signature,
        })
        .send(request_a0.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['id'].startsWith('s5')).to.equal(true);
          a_post_set.post_id = res.body['id'];
          done();
        });
    });
    it("CREATES POSTS: B - 1 persists", function (done) {
      chai
        .request(server)
        .put(request_b.endpoint)
        .set({
          "x-client-pubkey": request_b.pubkey,
          "x-nonce": request_b.nonce,
          "x-client-signature": request_b.signature,
        })
        .send(request_b.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['id'].startsWith('s5')).to.equal(true);
          b_post_set.post_id = res.body['id'];
          done();
        });
    });
    it("CREATES POSTS: C - 1 persists", function (done) {
      chai
        .request(server)
        .put(request_c.endpoint)
        .set({
          "x-client-pubkey": request_c.pubkey,
          "x-nonce": request_c.nonce,
          "x-client-signature": request_c.signature
        })
        .send(request_c.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['id'].startsWith('s5')).to.equal(true);
          c_post_set.post_id = res.body['id'];
          done();
        });
    });
    // it("EDITS POSTS: C ", function (done) {
    //   chai
    //     .request(server)
    //     .post(request_c_edit.endpoint)
    //     .set({
    //       "x-client-pubkey": request_c_edit.pubkey,
    //       "x-nonce": request_c_edit.nonce,
    //       "x-client-signature": request_c_edit.signature
    //     })
    //     .send({
    //       post_id: c_post_set.post_id,
    //       cypher_json: c_post_edit_set.cypher
    //     })
    //     .end((err, res) => {
    //       res.should.have.status(200);
    //       expect(res.body['status']).to.equal(true);
    //       done();
    //     });
    // });
    it("GETS A SELF POSTS", function (done) {
      chai
        .request(server)
        .get(request_a_get_self.endpoint)
        .set({
          "x-client-pubkey": request_a_get_self.pubkey,
          "x-nonce": request_a_get_self.nonce,
          "x-client-signature": request_a_get_self.signature,
        })
        .end((err, res) => {
          res.should.have.status(200);
          // 1 EXPIRED, 1 PERSISTED
          expect(res.body['posts'].length === 1).to.equal(true);
          expect(res.body['posts'][0].cypher_json).to.equal(a_post_set.cypher);
          done();
        })
    });
    it("GETS B SELF POSTS", function (done) {
      chai
        .request(server)
        .get(request_b_get_self.endpoint)
        .set({
          "x-client-pubkey": request_b_get_self.pubkey,
          "x-nonce": request_b_get_self.nonce,
          "x-client-signature": request_b_get_self.signature,
        })
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['posts'].length === 1).to.equal(true);
          expect(res.body['posts'][0].cypher_json).to.equal(b_post_set.cypher);
          done();
        });
    });
    it("GETS C SELF POSTS", function (done) {
      chai
        .request(server)
        .get(request_c_get_self.endpoint)
        .set({
          "x-client-pubkey": request_c_get_self.pubkey,
          "x-nonce": request_c_get_self.nonce,
          "x-client-signature": request_c_get_self.signature,
        })
        .end((err, res) => {
          res.should.have.status(200);

          expect(res.body['posts'].length === 1).to.equal(true);
          expect(res.body['posts'][0].cypher_json).to.equal(c_post_set.cypher);
          // expect(res.body['posts'][0].edited).to.equal(true);
          done();
        });
    });
    it("GETS C OTHERS POSTS -> None as B has not shared keys", function (done) {
      chai
        .request(server)
        .get(request_c_get_others.endpoint)
        .set({
          "x-client-pubkey": request_c_get_others.pubkey,
          "x-nonce": request_c_get_others.nonce,
          "x-client-signature": request_c_get_others.signature,
        })
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['posts'].length === 0).to.equal(true);
          // expect(res.body['posts'][0].cypher_json).to.equal(b_post_set.cypher);
          done();
        });
    });
  });

  describe("UPDATE POST KEYS based on Trust Announcements and VERIFY via GET OTHERS", function () {
    let request_a;
    let request_b;
    let request_c;
    let request_a_get_others;
    let request_b_get_others;
    let request_c_get_others;

    it("CREATES POST KEY REQUESTS", async function () {
      request_a = await createKeyStoreUpdate(a_post_set, a_trust, a_key_set);
      request_b = await createKeyStoreUpdate(b_post_set, b_trust, b_key_set);
      request_c = await createKeyStoreUpdate(c_post_set, c_trust, c_key_set);
      request_a_get_others = await createPostsGetOthersRequest(a_key_set);
      request_b_get_others = await createPostsGetOthersRequest(b_key_set);
      request_c_get_others = await createPostsGetOthersRequest(c_key_set);
    });

    it("UPDATES POST DECRYPTION KEYS of A TRUSTED", function (done) {
      chai
        .request(server)
        .put(request_a.endpoint)
        .set({
          "x-client-pubkey": request_a.pubkey,
          "x-nonce": request_a.nonce,
          "x-client-signature": request_a.signature,
        })
        .send(request_a.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("UPDATES POST DECRYPTION KEYS of B TRUSTED", function (done) {
      chai
        .request(server)
        .put(request_b.endpoint)
        .set({
          "x-client-pubkey": request_b.pubkey,
          "x-nonce": request_b.nonce,
          "x-client-signature": request_b.signature,
        })
        .send(request_b.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("UPDATES POST DECRYPTION KEYS of C TRUSTED", function (done) {
      chai
        .request(server)
        .put(request_c.endpoint)
        .set({
          "x-client-pubkey": request_c.pubkey,
          "x-nonce": request_c.nonce,
          "x-client-signature": request_c.signature,
        })
        .send(request_c.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("GETS A OTHERS POSTS and VERIFY via ABILITY TO DECRYPT", function (done) {
      chai
        .request(server)
        .get(request_a_get_others.endpoint)
        .set({
          "x-client-pubkey": request_a_get_others.pubkey,
          "x-nonce": request_a_get_others.nonce,
          "x-client-signature": request_a_get_others.signature,
        })
        .send(request_a_get_others.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['posts'].length).to.equal(1);

          const shared_sercret = bitcoin.calculate_shared_secret({
            privkey: a_key_set.identity_private,
            pubkey: c_key_set.identity_pubkey
          }) as string;

          const c_decryption_key = s5crypto.decryptAESMessageWithIV(res.body['posts'][0].decryption_key, shared_sercret) as string;
          const c_decrypted_post = s5crypto.decryptAESMessageWithIV(res.body['posts'][0].cypher_json, c_decryption_key) as string;
          expect(JSON.parse(c_decrypted_post)['type']).to.equal(c_post_set.plain.type);
          done();
        });
    });
    it("GETS B OTHERS POSTS and VERIFY via ABILITY TO DECRYPT", function (done) {
      chai
        .request(server)
        .get(request_b_get_others.endpoint)
        .set({
          "x-client-pubkey": request_b_get_others.pubkey,
          "x-nonce": request_b_get_others.nonce,
          "x-client-signature": request_b_get_others.signature,
        })
        .send(request_b_get_others.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['posts'].length).to.equal(1);

          const shared_sercret = bitcoin.calculate_shared_secret({
            privkey: b_key_set.identity_private,
            pubkey: a_key_set.identity_pubkey
          }) as string;

          const a_decryption_key = s5crypto.decryptAESMessageWithIV(res.body['posts'][0].decryption_key, shared_sercret) as string;
          const a_decrypted_post = s5crypto.decryptAESMessageWithIV(res.body['posts'][0].cypher_json, a_decryption_key) as string;
          expect(JSON.parse(a_decrypted_post)['type']).to.equal(a_post_set.plain.type);
          done();
        });
    });
    it("GETS C OTHERS POSTS and VERIFY via ABILITY TO DECRYPT", function (done) {
      chai
        .request(server)
        .get(request_c_get_others.endpoint)
        .set({
          "x-client-pubkey": request_c_get_others.pubkey,
          "x-nonce": request_c_get_others.nonce,
          "x-client-signature": request_c_get_others.signature,
        })
        .send(request_c_get_others.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['posts'].length).to.equal(1);
          const shared_sercret = bitcoin.calculate_shared_secret({
            privkey: c_key_set.identity_private,
            pubkey: b_key_set.identity_pubkey
          }) as string;

          const b_decryption_key = s5crypto.decryptAESMessageWithIV(res.body['posts'][0].decryption_key, shared_sercret) as string;
          const b_decrypted_post = s5crypto.decryptAESMessageWithIV(res.body['posts'][0].cypher_json, b_decryption_key) as string;
          expect(JSON.parse(b_decrypted_post)['type']).to.equal(b_post_set.plain.type);
          done();
        });
    });
  });
  describe("UPDATED POST BY C", function () {
    let request_c_edit, request_c_get_self;
    it("CREATES EDIT/GET POST REQUESTS", async function () {
      request_c_edit = await editPostRequest(c_post_set, c_key_set);
      request_c_get_self = await createPostsGetSelfRequest(c_key_set);
    });
    it("EDITS POSTS: C ", function (done) {
      chai
        .request(server)
        .post(request_c_edit.endpoint)
        .set({
          "x-client-pubkey": request_c_edit.pubkey,
          "x-nonce": request_c_edit.nonce,
          "x-client-signature": request_c_edit.signature
        })
        .send(request_c_edit.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
    it("GETS C SELF POSTS", function (done) {
      chai
        .request(server)
        .get(request_c_get_self.endpoint)
        .set({
          "x-client-pubkey": request_c_get_self.pubkey,
          "x-nonce": request_c_get_self.nonce,
          "x-client-signature": request_c_get_self.signature,
        })
        .end((err, res) => {
          res.should.have.status(200);

          expect(res.body['posts'].length === 1).to.equal(true);
          expect(res.body['posts'][0].cypher_json).to.equal(c_post_set.cypher);
          expect(res.body['posts'][0].edited).to.equal(true);
          done();
        });
    });
  });

  describe("REVOKE A->B TRUST", function () {
    let request_a;
    it("CREATES REVOKE REQUEST", async function () {
      request_a = await createRevokeTrustRequest(b_key_set.identity_pubkey, a_key_set);
    });
    it("REVOKES TRUST FROM A->B", function (done) {
      chai
        .request(server)
        .post(request_a.endpoint)
        .set({
          "x-client-pubkey": request_a.pubkey,
          "x-nonce": request_a.nonce,
          "x-client-signature": request_a.signature,
        })
        .send(request_a.body)
        .end((err, res) => {
          res.should.have.status(200);
          expect(res.body['status']).to.equal(true);
          done();
        });
    });
  });

  
  describe("TEST NOTIFICATION SOCKETS", function(){
    let b_sock_req,c_sock_req;
    let b_sock,c_sock;
    const options = {  
      headers: {},
    };
    const socketUrl = `ws://localhost:${TEST_PORT}/api/v3/notifications`;
    it("CREATE SOCKET OPEN REQUESTS", async function(){
      c_sock_req = await createSocketConnectionRequest(c_key_set);
      b_sock_req = await createSocketConnectionRequest(b_key_set);
      // c_sock_req = await createSocketConnectionRequest(c_key_set);
    });
    it("TEST SOCKET CONNECTIONS", function(done){
      options.headers['x-nonce'] =  c_sock_req.nonce;
      options.headers['x-client-pubkey'] =  c_sock_req.pubkey;
      options.headers['x-client-signature'] =  c_sock_req.signature;
      c_sock = new WebSocket(socketUrl,options);
      c_sock.on('message', function(msg){
        console.log('C (inbox): ' + msg.toString());
        // expect(msg.toString()).to.be.equal('Securely connected to cypherpost notification stream.');
      });
      c_sock.on('connect_error', function(msg){
       console.log(msg);
      });
      options.headers['x-nonce'] = b_sock_req.nonce;
      options.headers['x-client-pubkey'] = b_sock_req.pubkey;
      options.headers['x-client-signature'] = b_sock_req.signature;
      b_sock = new WebSocket(socketUrl,options);
      b_sock.on('message', function(msg){
        console.log('B (inbox): ' + msg.toString());
        // expect(msg.toString()).to.be.equal('Securely connected to cypherpost notification stream.');
      });
      b_sock.on('connect_error', function(msg){
        console.log(msg);
      });


      setTimeout(()=>{
        b_sock.send(b_post_set.post_id); // C will get this in her inbox
        c_sock.send("This message will not be accepted by cypherpost stream.");

        done();
      }, 5000);
    });
  });

  describe("E: 409's", function () {
    let request_a;
    let request_b;
    let request_c;

    it("CREATES REQUEST OBJECTS", async function () {
      request_a = await createIdentityRegistrationRequest("alivf", a_key_set);
      // console.log({ request_a })
      request_b = await createAnnouncementIssueRequest(AnnouncementType.Trusted, c_key_set.identity_pubkey, b_key_set);
      request_c = await createKeyStoreUpdate(c_post_set, c_trust, c_key_set);
    });
    it("PREVENTS REUSING INVITATION", function (done) {
      // console.log({request_a})
      chai
        .request(server)
        .post(request_a.endpoint)
        .set({
          "x-client-pubkey": request_a.pubkey,
          "x-nonce": request_a.nonce,
          "x-client-signature": request_a.signature,
          "x-client-invite-code": a_invitation
        })
        .send(request_a.body)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
    it("PREVENTS DUPLICATE TRUST ANNOUNCEMENT", function (done) {
      chai
        .request(server)
        .post(request_b.endpoint)
        .set({
          "x-client-pubkey": request_b.pubkey,
          "x-nonce": request_b.nonce,
          "x-client-signature": request_b.signature,
        })
        .send(request_b.body)
        .end((err, res) => {
          res.should.have.status(409);
          done();
        });
    });
    it("PREVENTS DUPLICATE POSTS DECRYPTION KEY ENTRY", function (done) {
      chai
        .request(server)
        .put(request_c.endpoint)
        .set({
          "x-client-pubkey": request_c.pubkey,
          "x-nonce": request_c.nonce,
          "x-client-signature": request_c.signature,
        })
        .send(request_c.body)
        .end((err, res) => {
          res.should.have.status(409);
          done();
        });
    })
  });

  describe("GLOBAL", function () {
    // tslint:disable-next-line: one-variable-per-declaration
    let request_a,
      request_b,
      request_c;

    it("CREATES SERVER IDENTITY REQUEST", async function () {
      request_a = await createServerIdentityRequest(a_key_set);
    });
    it("GETS SERVER PUBKEY", function (done) {
      chai
        .request(server)
        .get(request_a.endpoint)
        .set({
          "x-client-pubkey": request_a.pubkey,
          "x-nonce": request_a.nonce,
          "x-client-signature": request_a.signature,
        })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    })

    it("CREATES DELETE REQUEST", async function () {
      request_a = await createDeleteIdentityRequest(a_key_set);
      request_b = await createDeleteIdentityRequest(b_key_set);
      request_c = await createDeleteIdentityRequest(c_key_set);
    });

    it("DELETES ALL CREATED IDENTITIES AND ALL ASSOCIATIONS", function (done) {
      chai
        .request(server)
        .delete(request_a.endpoint)
        .set({
          "x-client-pubkey": request_a.pubkey,
          "x-nonce": request_a.nonce,
          "x-client-signature": request_a.signature,
        })
        .send(body)
        .end((err, res) => {
          res.should.have.status(200);
        });

      chai
        .request(server)
        .delete(request_b.endpoint)
        .set({
          "x-client-pubkey": request_b.pubkey,
          "x-nonce": request_b.nonce,
          "x-client-signature": request_b.signature,
        })
        .send(body)
        .end((err, res) => {
          res.should.have.status(200);
        });

      chai
        .request(server)
        .delete(request_c.endpoint)
        .set({
          "x-client-pubkey": request_c.pubkey,
          "x-nonce": request_c.nonce,
          "x-client-signature": request_c.signature,
        })
        .send(body)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

  });

});




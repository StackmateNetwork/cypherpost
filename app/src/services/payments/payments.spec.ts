/*
cypherpost.io
Developed @ Stackmate India
*/

import { expect } from "chai";
import "mocha";
import { CypherpostBitcoinOps } from "../../lib/bitcoin/bitcoin";
import { DbConnection } from "../../lib/storage/interface";
import { MongoDatabase } from "../../lib/storage/mongo";
import { CypherpostPayments } from "./payments";

const bitcoin = new CypherpostBitcoinOps();
const payments = new CypherpostPayments();
const db = new MongoDatabase();
// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------

let message = "GET payments/address";
let xpub = "xpub6CAEPnbkCHtuM1BR5iVQsXEkPBzDoEYF3gyHcZSzJW23CEJm55tmVxwVcdSX6FJFTrwccY8YG4ur3Wjyg2SoxVjGhpJpwUcMd3eBrC4wHdH";
let xprv = "xprv9yAszH4rMvLc8X6wygxQWPJ1qA9jPmpPgU3gpB3NkAV4KRycXYaWxAd1mPo9yzybuhANVb7WmnjjLWyWjt5tq772RKPpcRF2FAN2nRTBMMC";
let ecdsa_keys;
let signature;
/*
{
  "xprv": "[8f8bb5c0/128'/0'/0']xprv9yAszH4rMvLc8X6wygxQWPJ1qA9jPmpPgU3gpB3NkAV4KRycXYaWxAd1mPo9yzybuhANVb7WmnjjLWyWjt5tq772RKPpcRF2FAN2nRTBMMC/*",
  "xpub": "[8f8bb5c0/128'/0'/0']xpub6CAEPnbkCHtuM1BR5iVQsXEkPBzDoEYF3gyHcZSzJW23CEJm55tmVxwVcdSX6FJFTrwccY8YG4ur3Wjyg2SoxVjGhpJpwUcMd3eBrC4wHdH/*"
}
*/
let genesis_filter = 0;
// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------
describe("Initalizing Test: Payment Service", function () {
  before(async function () {
    const connection: DbConnection = {
      port: process.env.DB_PORT,
      ip: process.env.DB_IP,
      name: process.env.DB_NAME,
      auth: process.env.DB_AUTH,
    };
    await db.connect(connection);
    ecdsa_keys = await bitcoin.extract_ecdsa_pair({
      xpub, xprv
    });
    if (ecdsa_keys instanceof Error) throw ecdsa_keys;
    signature = await bitcoin.sign(message, ecdsa_keys.privkey);
  });
  describe("SINGLE PAYMENT AND UPDATE:", async function () {
    it("should get NEW ADDRESS for a given identity", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
    it("should get SAME ADDRESS for an already used identity", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
    it("should MAKE A PAYMENT TO given ADDRESS", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
    it("should GET UNCONFIRMED PAYMENT", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
    it("should GET HISTORY BY PUBKEY", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
    it("should UPDATE CONFIRMED TRANSACTION", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
  });
  describe("BATCH PAYMENT AND UPDATE:", async function () {
    it("should create 5 NEW ADDRESSES FOR 5 USERS", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
    it("should create 5 NEW ADDRESSES FOR 5 USERS", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
    it("should GET 5 UNCONFIRMED PAYMENTS", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
    it("should BATCH UPDATE 5 CONFIRMED PAYMENTS", async function () {
      const response = false;
      expect(response).to.equal(true);
    });
  });
});

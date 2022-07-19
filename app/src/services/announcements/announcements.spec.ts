/*
cypherpost.io
Developed @ Stackmate India
*/

import { expect } from "chai";
import "mocha";
import { CypherpostBitcoinOps } from "../../lib/bitcoin/bitcoin";
import { S5Crypto } from "../../lib/crypto/crypto";
import { DbConnection } from "../../lib/storage/interface";
import { MongoDatabase } from "../../lib/storage/mongo";
import { CypherpostIdentity } from "../identity/identity";
import { CypherpostAnnouncements } from "./announcements";
import { Announcement, AnnouncementType } from "./interface";
import { MongoAnnouncementStore } from "./mongo";
const sinon = require("sinon");

// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------
const bitcoin = new CypherpostBitcoinOps();
const announcement = new CypherpostAnnouncements();
const store = new MongoAnnouncementStore();
const s5crypto = new S5Crypto();
const db = new MongoDatabase();
// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------
/*
ROOT
{
  "fingerprint": "fcf5c473",
  "mnemonic": "want text option cargo region apology elegant easy uniform bird consider wedding sport spy romance scrap produce pluck cement thank country person ecology weird",
  "xprv": "xprv9s21ZrQH143K2C33LtYYTeVM187n1L1iKq1nyUJMsvxJJQNRxpkZzZfDxAv2iyds3E3Y5r3LeF3MBcasGGgvKfA2KmAqx61TFU46UZY8S9F"
}
PARENT e2ee'/cypherpost'/identity'
{
  "xprv": "[fcf5c473/128'/0'/0']xprv9zBSibqEyuQQktifoUyVajWgjuyWQz6B5Q3QPKo7nhKPGcimtFfdHjXZ8UBYi7Ycz6V7R1QrSk9uExx2xTb9mW6SprakREwVuC91233nJaD/*",
  "xpub": "[fcf5c473/128'/0'/0']xpub6DAo87N8pGxhyNo8uWWVwsTRHwozpSp2Scy1BiCjM2rN9R3vRnysqXr2ymokbVYGPzih9Ze1iW4GiKjnL7Eqdec4Gj2fcpvoScN1rfdVKjK/*"
}

ROOT1
{
  "fingerprint": "5d404b4f",
  "mnemonic": "solar spatial call country medal sunset twin brisk ocean history one exist change session inherit mesh swift document melt they over repeat link stick",
  "xprv": "xprv9s21ZrQH143K4JhmYa82pg6h31PMMTcmqwSDD4g6PLWJNpLFraD1FxBrcPz5mjATArQrvAxLiAtrHiWNtDQC4kt9qMvivFudCxL7G5AzMvu"
}
PARENT e2ee/cypherpost/identity
{
  "xprv": "[5d404b4f/128'/0'/0']xprv9yRZHsM6YXszFSuKhACgmV7DDX1GWzpJN7rL1CzWbvJ7F9uQ8y7UrjurKGdCSteFhKPrytgtVLNdkLTUR3hksooDan6AUg8ACQqcApeu1sk/*",
  "xpub": "[5d404b4f/128'/0'/0']xpub6CQuhNszNuSHTvynoBjh8d3wmYqkvTY9jLmvobQ8AFq67xEYgWRjQYELAXM5UCXiDYBZaiyoXsfGDd97imrJ3Btvo71Eb47ikZq8wJZYSoJ/*"
}

*/
let message = "GET /announcement/";

let xpub = "xpub6DAo87N8pGxhyNo8uWWVwsTRHwozpSp2Scy1BiCjM2rN9R3vRnysqXr2ymokbVYGPzih9Ze1iW4GiKjnL7Eqdec4Gj2fcpvoScN1rfdVKjK";
let xprv = "xprv9zBSibqEyuQQktifoUyVajWgjuyWQz6B5Q3QPKo7nhKPGcimtFfdHjXZ8UBYi7Ycz6V7R1QrSk9uExx2xTb9mW6SprakREwVuC91233nJaD";
let xpub1 =  "xpub6CQuhNszNuSHTvynoBjh8d3wmYqkvTY9jLmvobQ8AFq67xEYgWRjQYELAXM5UCXiDYBZaiyoXsfGDd97imrJ3Btvo71Eb47ikZq8wJZYSoJ";
let xprv1 =  "xprv9yRZHsM6YXszFSuKhACgmV7DDX1GWzpJN7rL1CzWbvJ7F9uQ8y7UrjurKGdCSteFhKPrytgtVLNdkLTUR3hksooDan6AUg8ACQqcApeu1sk";
let nonce = Date.now().toString();
let hash;
let ecdsa_keys;
let ecdsa_keys1;
let signature;
let genesis_filter = 0;

// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------

// SIMULATION CONSTANTS

const admin = "admin";
const pbz = "pbz";
const sushi = "sushi";
const bubble = "bubble";
const ch2 = "ch2";
const satoshi = "satoshi";
const outlier = "outlier";
const newuser = "newuser";
const ishi = "ishi";

const identities = [
  admin,pbz,sushi,bubble,ch2,satoshi,outlier,newuser,ishi,
];
const idObjects = {
  admin,pbz,sushi,bubble,ch2,satoshi,outlier,newuser,ishi,
 
};

// ------------------ ┌∩┐(◣_◢)┌∩┐ ------------------
describe("Initalizing Test: Badge Service", function () {
  const sandbox = sinon.createSandbox();

  before(async function () {
    sandbox.stub(CypherpostBitcoinOps.prototype, "verify").resolves(true);
    
    const connection: DbConnection = {
      port: process.env.DB_PORT,
      ip: process.env.DB_IP,
      name: process.env.DB_NAME,
      auth: process.env.DB_AUTH,
    };
    await db.connect(connection);

    ecdsa_keys = await bitcoin.extract_ecdsa_pair({xpub,xprv});
    if(ecdsa_keys instanceof Error) return ecdsa_keys;

    console.log({ecdsa_keys})
    ecdsa_keys1 = await bitcoin.extract_ecdsa_pair({xpub:xpub1,xprv:xprv1});
    if(ecdsa_keys instanceof Error) return ecdsa_keys;

    console.log({ecdsa_keys1})
    
    const message = `${ecdsa_keys.pubkey}:${ecdsa_keys1.pubkey}:${AnnouncementType.Trusted.toString()}:${nonce}`;
 
    signature = await bitcoin.sign(message,ecdsa_keys.privkey);

  });
  after(async () =>{
  sandbox.restore();

  })

  describe("ANNOUNCEMENT SERVICE UNIT TESTS:", async function () {
    it("CREATE new TRUST from xpub to xpub1", async function () {
      const response = await announcement.create(ecdsa_keys.pubkey, ecdsa_keys1.pubkey, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
    });
    it("409 for CREATE duplicate TRUST from xpub to xpub1", async function () {
      const response = await announcement.create(ecdsa_keys.pubkey, ecdsa_keys1.pubkey, AnnouncementType.Trusted,nonce, signature);
      expect(response['name']).to.equal("409");
    });
    it("FIND announcements by maker", async function () {
      const response = await announcement.findByMaker(ecdsa_keys.pubkey,genesis_filter);
      expect(response[0]['by']===ecdsa_keys.pubkey).to.equal(true);
    });
    it("FIND announcements by receiver", async function () {
      const response = await announcement.findByReceiver(ecdsa_keys1.pubkey,genesis_filter);
      expect(response[0]['to']===ecdsa_keys1.pubkey).to.equal(true);
    });
    it("FIND announcements by maker w/ upto date genesis_filter", async function () {
      const response = await announcement.findByMaker(xpub,Date.now()) as Announcement[];
      expect(response.length).to.equal(0);
    });
    it("FIND announcements by receiver w/ upto date genesis_filter", async function () {
      const response = await announcement.findByReceiver(ecdsa_keys1.pubkey,Date.now()) as Announcement[];;
      expect(response.length).to.equal(0);
    });
    it("FIND 0 announcements w/ upto data genesis_filter", async function () {
      const response = await announcement.getAll(Date.now());
      if (response instanceof Error) throw response
      expect(response.length === 0).to.equal(true);
    });
    it("REVOKE badge", async function () {
      const response = await announcement.revoke(ecdsa_keys.pubkey, ecdsa_keys1.pubkey, AnnouncementType.Trusted);
      expect(response).to.equal(true);
    });
    it("FIND 0 announcements post revoke", async function () {
      const response = await announcement.findByReceiver(ecdsa_keys1.pubkey,genesis_filter);
      if (response instanceof Error) throw response
      expect(response.length === 0).to.equal(true);
    });
    it("CREATE new TRUST from pubkey to pubkey1", async function () {
      const response = await announcement.create(ecdsa_keys.pubkey, ecdsa_keys1.pubkey, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
    });
    it("REMOVE ALL by pubkey", async function () {
      const response = await announcement.removeAllOfUser(ecdsa_keys.pubkey);
      expect(response).to.equal(true);
    });
    it("FIND 0 announcements post revoke", async function () {
      const response = await announcement.getAll(0);
      if (response instanceof Error) throw response
      expect(response.length === 0).to.equal(true);
    });
  });

  describe("BADGE SIMULATION: USER PERSPECTIVES", async function(){


    it("SIMULATE GIVING TRUST ANNOUNCEMENTS AMONG USERS:", async function () {
      await simulateAnnouncements('nonce', 'signature');
    });
    it("GETS ANNOUNCEMENTS AS newuser AND TRIES TO FIGURE OUR WHO IS WHO",async function(){
      const all_announcements = await announcement.getAll(0);
      if(all_announcements instanceof Error) throw all_announcements;
      // OPERATE ON ANNOUNCEMENTS

      let trustObject = {};
      let ids_with_announcements = [];
      identities.map((id)=>{
        ids_with_announcements.push({
          id: id,
          given: all_announcements.filter((announcement)=>
            announcement.by === id
          ).map((badge)=> Object({to:badge.to,type:badge.type})),
          received: all_announcements.filter((announcement)=>
          announcement.to === id
          ).map((announcement)=>  Object({from: announcement.by, type:announcement.type})),
      })});
        ids_with_announcements.map((object)=>{
        trustObject[object.id] = 
          object.given.map(obj=>obj.to);
           
      });
      console.log(JSON.stringify(trustObject,null,2));
    });
    it("CLEAN UP AFTER SIMULATION",async function(){
      let response = await store.removeAllTest();
      expect(response).to.equal(true);
    })
  });

});


async function simulateAnnouncements(nonce: string,signature: string){
  let response = await announcement.create(admin, ishi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(admin, pbz, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(pbz, ishi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(ishi, pbz, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(sushi, ishi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(bubble, ishi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(ishi, sushi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(ishi, bubble, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(satoshi, pbz, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(pbz, satoshi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(ishi, satoshi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(sushi, satoshi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(bubble, satoshi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(newuser, satoshi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(newuser, admin, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(outlier, satoshi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(ishi, ch2, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(bubble, ch2, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(sushi, ch2, AnnouncementType.Scammer,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(ch2, ishi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);    
      response = await announcement.create(ch2, bubble, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(ch2, sushi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
      response = await announcement.create(ch2, satoshi, AnnouncementType.Trusted,nonce, signature);
      expect(response).to.equal(true);
}
export interface AnnouncementInterface{
  create(by: string, to: string, type: AnnouncementType, nonce: string, signature: string): Promise<boolean | Error>;
  findByMaker(by: string, genesis_filter: Number): Promise<Announcement[] | Error>;
  findByReceiver(to:string, genesis_filter: Number):  Promise<Announcement[] | Error>;
  revoke(by: string, to: string, type: AnnouncementType): Promise<boolean | Error>;
  removeAllOfUser(pubkey: string): Promise<boolean | Error>;
  getAll(genesis_filter: Number): Promise<Announcement[] | Error>;
}

export interface AnnouncementStore{
  create(announcement: Announcement): Promise<boolean | Error>;
  readAll(genesis_filter: Number):Promise<Announcement[] | Error>;
  readByMaker(by: string, genesis_filter: Number): Promise<Announcement[] | Error>;
  readByReceiver(to: string, genesis_filter: Number): Promise<Announcement[] | Error>;
  removeByReceiver(by: string, to: string, type: AnnouncementType): Promise<boolean | Error>;
  removeAll(pubkey: string): Promise<boolean | Error>;
}

export interface Announcement {
  genesis: number;
  by: string;
  to: string;
  type: AnnouncementType;
  hash: string;
  nonce: string;
  signature: string;
}
export enum AnnouncementType {
  Trusted="TRUST",
  Scammer="SCAM",
  Buy="BUY",
  Sell="SELL",
}

export interface AnnouncementInterface{
  create(by: string, to: string, kind: AnnouncementType, nonce: string, signature: string): Promise<boolean | Error>;
  findByMaker(by: string, genesis_filter: number): Promise<Announcement[] | Error>;
  findByReceiver(to:string, genesis_filter: number):  Promise<Announcement[] | Error>;
  revoke(by: string, to: string, kind: AnnouncementType): Promise<boolean | Error>;
  removeAllOfUser(pubkey: string): Promise<boolean | Error>;
  getAll(genesis_filter: number): Promise<Announcement[] | Error>;
}

export interface AnnouncementStore{
  create(announcement: Announcement): Promise<boolean | Error>;
  readAll(genesis_filter: number):Promise<Announcement[] | Error>;
  readByMaker(by: string, genesis_filter: number): Promise<Announcement[] | Error>;
  readByReceiver(to: string, genesis_filter: number): Promise<Announcement[] | Error>;
  removeByReceiver(by: string, to: string, kind: AnnouncementType): Promise<boolean | Error>;
  removeAll(pubkey: string): Promise<boolean | Error>;
}

export interface Announcement {
  genesis: number;
  by: string;
  to: string;
  kind: AnnouncementType;
  hash: string;
  nonce: string;
  signature: string;
}
export enum AnnouncementType {
  Trust="Trust",
  Scam="Scam",
  Escrow="Escrow",
}

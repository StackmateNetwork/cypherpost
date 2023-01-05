/*
cypherpost.io
Developed @ Stackmate India
*/

export interface IdentityInterface{
  register(username: string, pubkey: string, type: RegistrationType, invite_code?: string):Promise<boolean | Error>;
  authenticate(pubkey: string, message: string, signature: string): Promise<boolean | Error>;
  updateStatus(pubkey:string, status: VerificationStatus): Promise<boolean | Error>;
  all(genesis_filter: number): Promise<Array<UserIdentity> | Error>;
  createInviteAsAdmin(type: InvitationCodeType,count: number): Promise<string | Error>;
  createInviteAsUser(invite_code: string): Promise<string | Error>;
  getInviteDetail(invite_code: string):Promise<InviteCode | Error>;
  remove(pubkey: string): Promise<boolean | Error>;
  myIdentity(pubkey:string): Promise<UserIdentity | Error>;
  myInviteCode(pubkey:string): Promise<InviteCode | Error>;

}

export interface IdentityStore{
  createOne(identity: UserIdentity): Promise<boolean | Error>;
  readOne(index: string, indexType: IdentityIndex): Promise<UserIdentity | Error>;
  updateOne(pubkey: string, status: VerificationStatus):Promise<boolean | Error>;
  readAll(genesis_filter: number): Promise<Array<UserIdentity> | Error>;
  removeOne(pubkey: string): Promise<boolean | Error>;
}

export interface InviteStore{
  createOne(invite_code: string,type: InvitationCodeType,created_by: string,count: number): Promise<boolean | Error>;
  checkOneByStatus(invite_code: string, status: InvitationCodeStatus): Promise<boolean | Error>;
  findOne(invite_code: string): Promise<InviteCode | Error>;
  findOneByPubkey(pubkey: string): Promise<InviteCode | Error>
  findOneByType(invite_code: string, type: InvitationCodeType): Promise<InviteCode | Error>
  updateOneStatus(invite_code: string, status: InvitationCodeStatus,claimed_by: string):Promise<boolean | Error>;
  removeOne(invite_code: string): Promise<boolean | Error>;
  
}

export interface UserIdentity{
  genesis : number;
  username: string;
  pubkey:string;
  status: VerificationStatus;
};
export interface InviteCode{
  genesis : number;
  invite_code: string;
  kind:InvitationCodeType;
  status: VerificationStatus;
  claimed_by: string,
  created_by: string,
  count: number,
};

export enum RegistrationType{
  Invite,
  Payment
}

export enum VerificationStatus{
  Verified = "VERIFIED",
  Partial = "PARTIAL",
  Pending = "PENDING"
}

export enum InvitationCodeStatus{
  Unclaimed = "UNCLAIMED",
  Claimed = "CLAIMED",
}
export enum InvitationCodeType{
  Standard = "STANDARD",
  Privileged = "PRIVILEGED",
}

export enum IdentityIndex{
  Username,
  Pubkey
}

/*
cypherpost.io
Developed @ Stackmate India
*/

export interface IdentityInterface{
  register(username: string, pubkey: string, type: RegistrationType, invite_code?: string):Promise<boolean | Error>;
  authenticate(pubkey: string, message: string, signature: string): Promise<boolean | Error>;
  updateStatus(pubkey:string, status: VerificationStatus): Promise<boolean | Error>;
  all(genesis_filter: number): Promise<Array<UserIdentity> | Error>;
  createInvite(type: InvitationCodeType): Promise<string | Error>;
  createUserInvite(invite_secret: string): Promise<string | Error>;
  remove(pubkey: string): Promise<boolean | Error>;
}

export interface IdentityStore{
  createOne(identity: UserIdentity): Promise<boolean | Error>;
  readOne(index: string, indexType: IdentityIndex): Promise<UserIdentity | Error>;
  updateOne(pubkey: string, status: VerificationStatus):Promise<boolean | Error>;
  readAll(genesis_filter: number): Promise<Array<UserIdentity> | Error>;
  removeOne(pubkey: string): Promise<boolean | Error>;
}

export interface InviteStore{
  createOne(invite_code: string,type: InvitationCodeType): Promise<boolean | Error>;
  checkOneStatus(invite_code: string, status: InvitationCodeStatus): Promise<boolean | Error>;
  checkOneType(invite_code: string, type: InvitationCodeType): Promise<boolean | Error>;
  updateOne(invite_code: string, status: InvitationCodeStatus):Promise<boolean | Error>;
  removeOne(invite_code: string): Promise<boolean | Error>;
}

export interface UserIdentity{
  genesis : number;
  username: string;
  pubkey:string;
  status: VerificationStatus;
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

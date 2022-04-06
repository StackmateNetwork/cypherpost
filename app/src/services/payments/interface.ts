export interface PaymentInterface {
  getAddress(pubkey: string): Promise<string | Error>;
  getHistory(pubkey: string): Promise<UserPayment[] | Error>;
  getUnconfirmed(): Promise<UserPayment[] | Error>;
  singleUpdate(update: PaymentUpdate): Promise<boolean | Error>;
  batchUpdate(updates: PaymentUpdate[]): Promise<boolean | Error>;
  // spend(address: string, spent: number): Promise<boolean | Error>;
}

export interface PaymentStore {
  create(payment: UserPayment): Promise<boolean | Error>;
  readAll(genesis_filter: Number): Promise<UserPayment[] | Error>;
  readByPubkey(pubkey: string): Promise<UserPayment[] | Error>;  
  updateOne(update: PaymentUpdate): Promise<boolean | Error>;
  bulkUpdate(updates:PaymentUpdate[]): Promise<boolean | Error>;
  removeAll(): Promise<boolean | Error>;
}
export interface CypherpostWalletStore{
  create(wallet: CypherpostWallet): Promise<boolean | Error>;
  read(): Promise<CypherpostWallet | Error>;
  rotateIndex(): Promise<number | Error>;
  removeAll(): Promise<boolean | Error>;
}

export interface UserPayment {
  genesis: number;
  pubkey: string;
  address: string;
  index: number;
  amount: number;
  txid: string;
  timestamp: number;
  confirmed: boolean;
};

export interface PaymentUpdate{
  address?: string;
  txid?: string,
  timestamp?: string,
  confirmed?: boolean,
};

export enum PaymentIndex {
  Pubkey,
  Address
};

export interface CypherpostWallet{
  public_descriptor: string;
  last_used_index: number;
};
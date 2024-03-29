/*
cypherpost.io
Developed @ Stackmate India
*/

export interface PostInterface {
  create(owner: string, expiry: number, cypher_json: string, derivation_index: number, reference?: string): Promise<string | Error>;
  findManyById(ids: Array<string>, genesis_filter: number): Promise<Array<UserPost> | Error>;
  findAllByOwner(owner: string, genesis_filter: number): Promise<Array<UserPost> | Error>;

  editOne(id: string, owner: string, cypher_json: string): Promise<boolean | Error>;
  removeOneById(id: string, owner: string): Promise<boolean | Error>;
  removeManyById(ids: string[]): Promise<boolean | Error>;
  removeAllByOwner(owner: string): Promise<Array<string> | Error>;
  removeAllExpired(owner: string): Promise<Array<string> | Error>;
  removeAllExpiredByOwner(owner: string): Promise<Array<string> | Error>;
  getLastDerivationScheme(owner: string): Promise<number | Error>;
}

export interface PostStore {
  createOne(post: UserPost): Promise<boolean | Error>;
  readMany(indexes: Array<string>, index_type: PostStoreIndex, genesis_filter: number): Promise<Array<UserPost> | Error>;
  removeOne(owner: string, id: string): Promise<boolean | Error>;
  updateOne(id: string, owner: string, cypher_json: string): Promise<boolean | Error>;
  removeMany(indexes: Array<string>, index_type: PostStoreIndex): Promise<boolean | Error>;
}

export interface DerivationStore {
  readOne(owner:string): Promise<number | Error>;
  removeOne(owner: string): Promise<boolean | Error>;
  upsertOne(owner: string, derivation_index: number): Promise<boolean | Error>;
}

export interface DerivationIndex{
  owner: string,
  last_index: number
}

export interface UserPost {
  id?: string;
  reference?: string;
  genesis?: number;
  expiry?: number;
  owner?: string;
  cypher_json?: string;
  derivation_index?: number;
  edited?: boolean;
}

export enum PostStoreIndex {
  Owner,
  PostId
}

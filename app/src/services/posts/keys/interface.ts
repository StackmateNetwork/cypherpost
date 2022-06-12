/*
cypherpost.io
Developed @ Stackmate India
*/

export interface PostKeyInterface {
  addPostDecryptionKeys(giver: string, post_id: string, key_updates: PostKeyStoreUpdate[]): Promise<boolean | Error>;
  updatePostDecryptionKeys(giver: string, post_id: string, key_update: PostKeyStoreUpdate[]): Promise<boolean | Error>;
  findPostDecryptionKeyByReceiver(receiver: string, genesis_filter: Number): Promise<PostDecryptionKey[] | Error>;
  findPostDecryptionKeyByGiver(giver: string, genesis_filter: Number): Promise<PostDecryptionKey[] | Error>;
  removePostDecryptionKeyById(giver: string, post_id: string): Promise<boolean | Error>;
  removePostDecryptionKeyByReceiver(giver: string, receiver: string): Promise<boolean | Error>;
  removePostDecryptionKeyByGiver(giver: string): Promise<boolean | Error>;
  removeAllPostDecryptionKeyOfUser(xpub: string): Promise<boolean | Error>;
};


export interface PostDecryptionKeyStore {
  createMany(keys: PostDecryptionKey[]): Promise<boolean | Error>;
  readByGiver(giver: string, genesis_filter: Number): Promise<PostDecryptionKey[] | Error>;
  readByReceiver(receiver: string, genesis_filter: Number): Promise<PostDecryptionKey[] | Error>;
  readByPostId(post_id: string): Promise<PostDecryptionKey[] | Error>;
  removeManyByPostId(giver: string, post_id: string): Promise<boolean | Error>;
  removeManyByReceiver(giver: string, receiver: string): Promise<boolean | Error>;
  removeAllGiver(giver: string): Promise<boolean | Error>;
  removeAllReceiver(reviever: string): Promise<boolean | Error>;
  updateOne(giver: string, post_id: string, receiver: string, decryption_key: string): Promise<boolean | Error>;
}

export interface PostKeyStoreUpdate {
  receiver: string,
  decryption_key: string
}

export interface PostDecryptionKey {
  genesis: number;
  giver: string;
  receiver: string;
  post_id: string;
  decryption_key?: string;
}

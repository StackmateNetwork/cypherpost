/*
cypherpost.io
Developed @ Stackmate India
*/

import { handleError } from "../../lib/errors/e";
import * as stackmate from "../../lib/wallet/stackmate";
import { PaymentInterface, PaymentUpdate, UserPayment } from "./interface";
import { MongoCypherpostWalletStore, MongoPaymentStore } from "./mongo";

const paymentStore = new MongoPaymentStore();
const walletStore = new MongoCypherpostWalletStore();

export class CypherpostPayments implements PaymentInterface {
  async getAddress(pubkey: string): Promise<string | Error> {
    try{
      const user_payment_records =  await paymentStore.readByPubkey(pubkey);
      if (user_payment_records instanceof Error) return user_payment_records;
      const latest_record = user_payment_records[0];
      if(latest_record.txid.length===64){
        const cpwallet = await walletStore.read();
        if(cpwallet instanceof Error) return handleError(cpwallet);

        const ffi_result = await stackmate.getAddress(cpwallet.public_descriptor,cpwallet.last_used_index);
        if(ffi_result instanceof Error) return handleError(ffi_result);
        const new_payment_record: UserPayment = {
          genesis: Date.now(),
          pubkey: pubkey,
          address: ffi_result.address,
          index: cpwallet.last_used_index,
          amount: 0,
          txid: "NONE",
          confirmed: false,
          timestamp: 0
        };
        const status = await paymentStore.create(new_payment_record);
        if(status instanceof Error) return handleError(status);
        
        const index = await walletStore.rotateIndex();
        if(index instanceof Error) return handleError(index);

        return ffi_result.address;
      }
      else return latest_record.address;
    }
    catch(e){
      return handleError(e);
    }
  }
  async getHistory(pubkey: string): Promise<Error | UserPayment[]> {
    const user_payment_records =  await paymentStore.readByPubkey(pubkey);
    return user_payment_records;
  }
  async getUnconfirmed(): Promise<Error | UserPayment[]> {
    const user_payment_records =  await paymentStore.readAll(0);
    if (user_payment_records instanceof Error) return user_payment_records;
    return user_payment_records.filter(record=>{
      if(record.confirmed===false) return record;
    });
  }
  singleUpdate(update: PaymentUpdate): Promise<boolean | Error> {
    return paymentStore.updateOne(update);
  }
  batchUpdate(updates: PaymentUpdate[]): Promise<boolean | Error> {
    return paymentStore.bulkUpdate(updates);
  }
  // async spend(pubkey: string, amount: number): Promise<boolean | Error> {
  //   const user_payment_records =  await paymentStore.readByPubkey(pubkey);
  //   if (user_payment_records instanceof Error) return user_payment_records;

  //   let accumulator = 0;
  //   const spendable = [];
    
  //   user_payment_records.filter(record=>{
  //     if(record.exhausted===false && (record.amount>record.spent)){
  //       if(accumulator<=amount){
  //         accumulator += record.amount - record.spent;
  //         spendable.push(record);
  //       }
  //       else{
  //         return;
  //       }
  //     }
  //   });
    
  //   if (accumulator<amount) return handleError({
  //     code: 402,
  //     message: "Insufficient Balance. Get new address and top up with funds."
  //   });

  //   let cumulative_spent = amount;
  //   spendable.filter(async record=>{
  //     if(cumulative_spent<=0) return;
  
  //     if (cumulative_spent>=record.amount-record.spent){
  //       await paymentStore.updateOne({address: record.address, spent: record.amount - record.spent, exhausted: true});
  //       cumulative_spent -= record.amount - record.spent;
  //     }
  //     if (cumulative_spent<=record.amount-record.spent){
  //       await paymentStore.updateOne({address: record.address, spent: cumulative_spent});
  //       cumulative_spent = 0;
  //     }
  //   });

  //   return true;
  // }
};


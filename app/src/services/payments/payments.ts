/*
cypherpost.io
Developed @ Stackmate India
*/

import { handleError } from "../../lib/errors/e";
import * as stackmate from "../../lib/wallet/stackmate";
import { PaymentInterface, Transaction, UserPayment } from "./interface";
import { MongoPaymentStore } from "./mongo";

const paymentStore = new MongoPaymentStore();

export class CypherpostPayments implements PaymentInterface {
  async getAddress(pubkey: string): Promise<string | Error> {
    try{
      return "NOT IMPLEMENTED";
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
  singleUpdate(update: Transaction): Promise<boolean | Error> {
    return paymentStore.updateOne(update);
  }
  batchUpdate(updates: Transaction[]): Promise<boolean | Error> {
    return paymentStore.bulkUpdate(updates);
  }
  async getTransactionDetail(txid: string): Promise<Transaction | Error>{
    return new Error("NOT YET");
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


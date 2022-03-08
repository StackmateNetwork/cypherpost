/*
cypherpost.io
Developed @ Stackmate India
*/
// ------------------ '(◣ ◢)' ---------------------
import { Router } from "express";
import { handleGetPaymentAddress, handleGetPaymentHistory, paymentMiddleware } from "./dto";
// ------------------ '(◣ ◢)' ---------------------
export const router = Router();
// ------------------ '(◣ ◢)' ---------------------
router.use(paymentMiddleware);
router.get("/address",handleGetPaymentAddress);
router.get("/history",handleGetPaymentHistory);
// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------


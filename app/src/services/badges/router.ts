/*
cypherpost.io
Developed @ Stackmate India
*/
// ------------------ '(◣ ◢)' ---------------------
import { Router } from "express";
import * as val from "express-validator";
import { badgesMiddleware, handleGetAllBadges, handleGetMyBadges, handleRevokeTrust, handleGiveBadge } from "./dto";

// ------------------ '(◣ ◢)' ---------------------
export const router = Router();
// ------------------ '(◣ ◢)' ---------------------
const createBadgeCheck = [
  val.check('recipient').exists(),
  val.check('nonce').exists(), 
  val.check('signature').exists(),
];

const revokeTrustBadgeCheck = [
  val.check('revoking').exists()
];

const checkGetBadges = [
  val.check('genesis_filter').optional()
]
// ------------------ '(◣ ◢)' ---------------------
router.use(badgesMiddleware);
router.post("/:badge",createBadgeCheck, handleGiveBadge);
router.get("/all",checkGetBadges,handleGetAllBadges);
router.get("/self",handleGetMyBadges);
router.post("/:badge/revoke",revokeTrustBadgeCheck, handleRevokeTrust);
// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------


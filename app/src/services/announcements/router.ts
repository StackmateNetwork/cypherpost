/*
cypherpost.io
Developed @ Stackmate India
*/
// ------------------ '(◣ ◢)' ---------------------
import { Router } from "express";
import * as val from "express-validator";
import { announcementsMiddleware, handleGetAllAnnouncements, handleGetMyAnnouncements, handleRevokeTrust, handleMakeAnnouncement } from "./dto";

// ------------------ '(◣ ◢)' ---------------------
export const router = Router();
// ------------------ '(◣ ◢)' ---------------------
const createAnnouncementCheck = [
  val.check('recipient').exists(),
  val.check('nonce').exists(),
  val.check('signature').exists(),
];

const revokeTrustBadgeCheck = [
  val.check('revoking').exists()
];

const checkGetAnnouncements = [
  val.check('genesis_filter').optional()
]
// ------------------ '(◣ ◢)' ---------------------
router.use(announcementsMiddleware);
router.post("/:announcement",createAnnouncementCheck, handleMakeAnnouncement);
router.get("/all",checkGetAnnouncements,handleGetAllAnnouncements);
router.get("/self",handleGetMyAnnouncements);
router.post("/:announcement/revoke",revokeTrustBadgeCheck, handleRevokeTrust);
// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------


/*
cypherpost.io
Developed @ Stackmate India
*/
// ------------------ '(◣ ◢)' ---------------------
import express from "express";

import * as val from "express-validator";
import { handleCreatePost,handleGetPostAndKeysById, handleDeletePostAndReferenceKeys, handleEditPost, handleGetMyPosts, handleGetOthersPosts, handlePutKeys, postMiddleware } from "./dto";

// ------------------ '(◣ ◢)' ---------------------
export const router = express.Router();
// ------------------ '(◣ ◢)' ---------------------
const checkCreatePost = [
  val.check('expiry').exists(),
  val.check('derivation_scheme').exists(),
  val.check('cypher_json').exists(),
  val.check('reference').optional(),
];

const checkGetPosts=[
  val.check('genesis_filter').optional()
];

const checkUpdatePutKeys = [
  val.check('decryption_keys').exists().isArray(),
  val.check('post_id').exists()
];

const checkEditPost = [
  val.check('post_id').exists(),
  val.check('cypher_json').exists(),
];

// ------------------ '(◣ ◢)' ---------------------
router.use(postMiddleware);
router.put("/", checkCreatePost, handleCreatePost);
router.get("/self",checkGetPosts, handleGetMyPosts);
router.get("/others", checkGetPosts, handleGetOthersPosts);
router.put("/keys",checkUpdatePutKeys, handlePutKeys);
router.delete("/:id", handleDeletePostAndReferenceKeys);
router.get("/:id", handleGetPostAndKeysById);
router.post("/edit", checkEditPost, handleEditPost);
// ------------------° ̿ ̿'''\̵͇̿̿\з=(◕_◕)=ε/̵͇̿̿/'̿'̿ ̿ °------------------

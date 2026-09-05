import express from "express";

import {
  getDevelopers,
  getDeveloperByUsername,
} from "../controllers/developerController.js";

const router = express.Router();

// Barcha developerlar
router.get("/", getDevelopers);

// Bitta developer
router.get("/:username", getDeveloperByUsername);

export default router;
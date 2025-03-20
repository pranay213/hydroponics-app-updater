const express = require("express");

const { checkupdates, getApp, addNewApp } = require("../controllers/appController")

const router = express.Router();

router.get("/check-updates", checkupdates);
router.get("/get-app", getApp)
router.post("/add-app", addNewApp);




module.exports = router;

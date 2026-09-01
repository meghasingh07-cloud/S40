const express= require("express");
const router= express.Router();

const protect= require("../middleware/authMiddleware");

const{analyzeUrlController}=require("../controllers/urlController");

router.post("/analyze",protect,analyzeUrlController);

module.exports=router;
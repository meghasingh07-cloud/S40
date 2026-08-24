const express= require("express");
const mongoose= require ("mongoose");
const cors= require("cors");
require("dotenv").config();
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const scamRoutes = require("./routes/scamRoutes");
const messageRoutes = require("./routes/messageRoutes");
const messageCheckRoutes = require("./routes/messageCheckRoutes1");
const urlRoutes = require("./routes/urlRoutes");
const familyRoutes = require("./routes/familyRoutes");
const fraudShieldAIRoutes = require("./routes/fraudShieldAIRoutes");


const app=express();

app.use (cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/scam", scamRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/message", messageCheckRoutes);
app.use("/api/url", urlRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/ai", fraudShieldAIRoutes);

app.get("/",(req,res)=>{
    res.json({
        message:" Backend is running"
    });
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Mongodb connected ")

        app.listen(process.env.PORT || 5000 , ()=>{
            console.log(`server running on port${process.env.PORT || 5000}`)
        })
    })
    .catch((error) => {
        console.error("MongoDB connection failed:" , error.message);
    })
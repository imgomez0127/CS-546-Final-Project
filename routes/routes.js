const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const path = require("path");
const slugify = require("slugify");
const userOperations = require("../mongodbAPI/userOperations");
const saltRounds = 8;

let checkLoginValidity = async function(username,password){
    if(!username || !password){
        return false;
    }
    let user = await userOperations.getUserByUsername(username);
    if(!user["empty"]){
        let validPassword = await bcrypt.compare(password,user["password"]);
        return validPassword;
    }
    return false;
}

router.get("/",async (req,res)=>{
        try{
            if(req.session.loggedIn){
                let currentUser = await userOperations.getUserBySessionID(req.session.id);
                res.redirect("/profile/"+slugify(currentUser["username"]));
                return;
            }
            else{
                res.render("login",{
                    title:"Login",
                    loginError:(req.session.loginError) ? true : false
                });
                return;
            }
        }
        catch(e){
            console.log(e);
            res.sendStatus(500);
        }
});

router.post("/login",async (req,res)=>{
    try{
        let validLogin = await checkLoginValidity(req.body.username,req.body.password);
        if(validLogin){
            let user = await userOperations.getUserByUsername(req.body.username);
            await userOperations.addSessionToUser(user,req.session.id);
            req.session.loginError = false;
            res.redirect("/profile/"+slugify(user["username"]));
            return;
        }
        else{
            req.session.loginError = true;
            res.redirect("/");
            return;
        }
    }
    catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

router.post("/signup", async(req, res) =>{
    try{
        let username = req.body.username;
        let password = await bcrypt.hash(req.body.password, saltRounds);
        let location = req.body.location;
        let email = req.body.email;
        let successfulCreation = await userOperations.createUser(username,password,location,email);
        if(!successfulCreation){
            res.redirect("/");
            return;
        }
        res.redirect("/profile/"+slugify(username));
    }catch(e){
        console.log(e);
        res.status(500);
    }
});
module.exports = router;

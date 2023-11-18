import express from "express";
import db from "./db.js";
import cors from "cors";
import dotenv from "dotenv";

import bcrypt from "bcrypt";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createAccessTokens, createRefreshTokens, verifyRefreshToken, authenticationTokenCheck } from "./JWT.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200,
    methods: ['GET', 'POST'],

}));

app.use(session({
    key: 'userEmail',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 60 * 60 * 24},
}));

app.use(bodyParser.urlencoded({ extended: true }));


app.get('/getNewAccessToken' , (req, res) => {

    const refreshToken = req.headers['x-refresh-token'];
    const userEmail = req.headers['x-user-email'];
    
    if(!refreshToken) return res.status(404).json({ isThereAUser: false, message: 'Refresh token not provided!'});

    const dbGetRefreshtoken = `SELECT * FROM users WHERE email = ?`;
    db.query(dbGetRefreshtoken, [userEmail], async (err, result) => {
        if(err) return res.status(500).json("Server Problem!");
        if(result.length < 1) return res.status(500).json({ message: "No Users In Database!"}) 

        if(verifyRefreshToken(result[0].refreshToken) === false){
            res.sendStatus(401);
        }else{
            const newAccessToken = createAccessTokens(result[0]);
            res.json({auth: true, accessToken: newAccessToken})

        }
    })
   


});


app.post('/check-if-email-is-existing', async (req, res) =>{
    const user_email_register = req.body.email_register;
    const user_username_register = req.body.username_register;

    const dbSearchForExistingEmail = "SELECT * FROM users WHERE email = ? OR username = ?";
    db.query(dbSearchForExistingEmail, [user_email_register, user_username_register], (err, result) => {
        if(err) return res.send(err);
        if(result.length > 0){
            if(result[0].email === user_email_register){
                res.send({emailIsExisting: true});
            }
            if(result[0].username === user_username_register){
                res.send({usernameIsExisting: true});
            }
        }
        else{
            res.send(false);
        }
    })
});


app.post('/register', async (req, res) => {
    try{
        const user_email_register = req.body.email_register;
        const user_password_register = req.body.password_register;
        const user_username_register = req.body.username_register;
        const refreshToken = " ";
        const role = "user";

        const hashedPassword = await bcrypt.hash(user_password_register, 10);

        const dbRegister = "INSERT INTO users (email, password, refreshToken, username, role) VALUES (?, ?, ?, ?, ?)";
        db.query(dbRegister, [user_email_register, hashedPassword, refreshToken, user_username_register, role], (err, result) => {
            if (err) throw err;
            res.send("Success!");
        })


    }catch(err){
        console.log(err);
    }
});


app.post('/login', async (req, res) => {
    try{
        const user_email_login = req.body.email_login;
        const user_password_login = req.body.password_login;
        
        const dbLogin = `SELECT * FROM users WHERE email = '${user_email_login}'`;
        const dbSaveToken = `UPDATE users SET refreshToken = ? WHERE email = ?`;

        db.query(dbLogin, async (err, result) => {
            if(result.length <= 0){
                return res.status(400).send('Invalid email!');
            }
            

            const initializeUser = {id : result[0].id, email: result[0].password, password: result[0].email}

            try{
                
                await bcrypt.compare(user_password_login, result[0].password, (error, response) => {

                    if(response){
                        req.session.user = result;

                        const accessToken = createAccessTokens(initializeUser);
                        const refreshToken = createRefreshTokens(initializeUser);

                        db.query(dbSaveToken, [refreshToken, result[0].email], async (err, resultToken) => {
                            if(err){
                                console.log(err);
                                res.status(500).json("Server Problem!")
                            }else{
                                console.log(result[0].username)
                                res.json({auth: true, accessToken: accessToken, refreshToken: refreshToken, email: result[0].email, username: result[0].username})
                            }

                        })

                    }else{
                        res.json({auth: false, message: "Invalid password!"})
                    }


                })
               

            }catch(err){
                res.json({auth: false, message: "Problem with password, try again!"})
            }
        })

    }catch(err){
        console.log(err);
    }
});


app.get('/authenticationJWT', authenticationTokenCheck, async (req, res) => {
    
   res.json({isThereAUser: true})
        
});



app.listen(3001, () => {
    console.log("Connected to MySQL on port 3001");
});
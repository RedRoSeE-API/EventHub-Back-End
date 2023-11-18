import express from "express";
import db from "./db.js";
import cors from "cors";
import dotenv from "dotenv";


import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import multer from "multer";





dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,

}));

app.use(session({
    key: 'userEmail',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 60 * 60 * 24},
}));

app.use(bodyParser.urlencoded({ extended: true }));


var imgConfig = multer.diskStorage({

    destination: (req, file, callback) => {
        callback(null, "../client/src/uploads");
    },
    filename: (req, file, callback) => {
        callback(null, `image-${Date.now()}.${file.originalname}`);
    }

})

const imgFilter = (req, file, callback) => {

    if(file.mimetype.startsWith("image")){
        callback(null, true)
    }else(
        callback(null, Error('only image is alowed'))
    )

}

var uploads = multer({
    storage: imgConfig,
    fileFilter: imgFilter
})



app.post('/approvePost' , (req, res) => {

    const id = req.body.id
    
    const q = `UPDATE user_posts SET approved = true, changed = false WHERE id = ${id}`;
    db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
    })

});

app.post('/un-approvePost' , (req, res) => {

    const id = req.body.id
    
    const q = `UPDATE user_posts SET approved = false WHERE id = ${id}`;
    db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
    })

});

app.get('/getAllPosts' , (req, res) => {
    
   const q = "SELECT * FROM user_posts";
   db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
   })
   
});

app.get('/getAllApprovedPosts' , (req, res) => {
    
   const q = "SELECT * FROM user_posts WHERE approved = 1";
   db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
   })
});


app.post('/getUserPosts' , (req, res) => {

    const email = req.body.email;
    
   const q = `SELECT * FROM user_posts WHERE email = '${email}'`;
   db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
   })
});

app.post('/getUserSpecificPost' , (req, res) => {

    const email = req.body.email;
    const postId = req.body.id;
    
   const q = `SELECT * FROM user_posts WHERE email = '${email}' and id = ${postId}`;
   db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data[0]);
   })
});

app.post('/getUser' , (req, res) => {

    const email = req.body.email;
    
   const q = `SELECT * FROM users WHERE email = '${email}'`;
   db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data[0]);
   })
});


app.post('/postImages', uploads.single("image"), (req, res) => {
    console.log(req.body);
    console.log(req.file);

    const {title} = req.body;
    const {text} = req.body;
    const {filename} = req.file;
    const {email} = req.body;
    const approved = false
    const {date} = req.body;
    const {place} = req.body;




    if(!title || !text || !filename || !email){
         
        return res.status(422).json({status: 422, message: "Fill all the required fields!"})
    }



    try{
        
        const dbPost = "INSERT INTO user_posts (title, text, image_name, email, approved, place, date_time) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        db.query(dbPost, [title, text, filename, email, approved, place, date], (err, result) => {
            if (err) throw err;
            res.send("Success!");
        })

    }catch(err){
        res.status(422).json({status: 422, err})   
    }
})

app.post('/changeImages', uploads.single("image"), (req, res) => {
    console.log(req.body);
    console.log(req.file);

    const {title} = req.body;
    const {text} = req.body;
    console.log(`HERE  - ${req.file}`);
    let filename;
    if(req.file === undefined){
        filename = undefined;
    }else{
        filename = req.file.filename;
    }
    const {email} = req.body;
    const approved = false
    const {date} = req.body;
    const {place} = req.body;
    const {id} = req.body;
    const changed = true




    if(!title || !text || !email){
         
        return res.status(422).json({status: 422, message: "Fill all the required fields!"})
    }

    if(filename === undefined){
        console.log(`HERE - !!!!!!!!!`);

        try{
            
            const dbPost = `UPDATE user_posts SET title= ?, text= ?, place=?, date_time=?, changed=?, approved=? WHERE id= ?`;
            
            db.query(dbPost, [ title, text, place, date, changed, approved, id], (err, result) => {
                if (err) throw err;
                console.log(result)
                console.log('Must BE A Success!');
                res.send("Success!");
            })

        }catch(err){
            res.status(422).json({status: 422, err})   
        }

    }else{

        try{
            
            const dbPost = `UPDATE user_posts SET title= ?, text= ?, image_name= ?, place=?, date_time=?, changed=?, approved=? WHERE id= ?`;
            
            db.query(dbPost, [ title, text, filename, place, date, changed, approved, id], (err, result) => {
                if (err) throw err;
                res.send("Success!");
            })

        }catch(err){
            res.status(422).json({status: 422, err})   
        }

    }

})


app.listen(3002, () => {
    console.log("Connected to MySQL on port 3002");
});
import jwt from "jsonwebtoken";


export function createAccessTokens (user) {

    const accsessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRETE, {expiresIn: '30s'});
    
    return accsessToken;
}

export function createRefreshTokens (user) {
    
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRETE);
    return refreshToken;
}

export function verifyRefreshToken (token) {


    if(!token) return res.status(404).json({ isThereAUser: false, message: 'Resfresh token not provided!'});

    try{
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRETE, (err, result) => {
            if (err){
                return false;
            }else{
                return true;
            }
        })
    }catch(err){
        return res.send(400).json({ error: 'Bad Request' });
    }
}




export function authenticationTokenCheck(req, res, next) {
    const accessToken = req.headers['x-access-token'];
    if(!accessToken) return res.status(404).json({ isThereAUser: false, message: 'Access token not provided'});

    try{
        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRETE, (err, result) => {
            if (err){
                res.json({refreshTokenNeeded: true, isThereAUser: true});
            }else{
                req.authenticatedEmail = result.email;
                next();
            }
        })
    }catch(err){
        return res.send(400).json({ error: 'Bad Request' });
    }
}


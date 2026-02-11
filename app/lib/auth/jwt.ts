import jwt, {JwtPayload} from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET;

if(!JWT_SECRET){
    console.log("There is no JWT_SECRET found") 
}

export interface TokenPayload extends JwtPayload {
    userId: number
}

export function signToken(payload: TokenPayload){
    return jwt.sign(payload, JWT_SECRET, {expiresIn: '1d'})
}

export function verifyToken(token: string) : TokenPayload{
    return jwt.verify(token, JWT_SECRET ) as TokenPayload
}

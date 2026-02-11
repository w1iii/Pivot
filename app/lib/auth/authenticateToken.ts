import { cookies } from 'next/headers';
import { verifyToken } from './jwt'

export default async function authenticateToken(token){
    const cookiesStore = await cookies();
    try{
        const token = cookiesStore.get("token")?.value;
        if(!token) return null

        const decoded = verifyToken(token)
        return decoded
    }catch(e){
        console.log(e)
        return null 
    }

}

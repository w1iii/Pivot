import {NextRequest, NextResponse} from "next/server";
import {checkLogin} from './authController';

export async function POST(req: NextRequest){
    const body = await req.json();
    const {username, password} = body;

    const result = await checkLogin(username,password)

    if(result.success){
        const response = NextResponse.json({ message: "Logged in"})
        response.cookies.set('user', username, { httpOnly: true} );
        return response;
    }

    return NextResponse.json({ message: "Invalid Credentials"}, {status: 401});
}

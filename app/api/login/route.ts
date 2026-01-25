import {NextRequest, NextResponse} from "next/server";
import {checkLogin} from './authController';

export async function POST(req: NextRequest){
    const body = await req.json();
    const {email, password} = body;

    const result = await checkLogin(email,password)

    if(result.success){
        const response = NextResponse.json({ message: "Logged in"})
        response.cookies.set('user', email, { httpOnly: true} );
        return response;
    }

    return NextResponse.json({ message: "Invalid Credentials"}, {status: 401});
}

import {NextRequest, NextResponse} from "next/server";
import {checkLogin} from './authController';

interface User{
    id: number;
    email: string;
}

interface Result{
    success: boolean;
    user?: User;
    message?: string;
}

export async function POST(req: NextRequest){
    const body = await req.json();
    const {email, password} = body;

    const result: Result = await checkLogin(email,password)


    if (result.success && result.user) {
        const response = NextResponse.json({ message: "Logged in", user: result.user });

        // Use the email from the returned user, not the request body
        response.cookies.set("user", result.user.email, {
            httpOnly: true,
            path: "/",        // make cookie accessible throughout site
            sameSite: "strict",
        });

        return response;
    }

    return NextResponse.json({ message: "Invalid Credentials"}, {status: 401});
}

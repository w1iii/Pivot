
import {NextRequest, NextResponse} from "next/server";

export async function POST(req: NextRequest){
    const body = await req.json();
    const {firstname, lastname, address, email, contactno, password} = body;

    const user = {
        firstname: firstname,
        lastname: lastname,
        address: address,
        email: email,
        contactno: contactno,
        password: password,
    }
    const response = NextResponse.json({ message: "Logged in", user})

    return response
}

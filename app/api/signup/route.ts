
import {NextRequest, NextResponse} from "next/server";
import pool from '../../lib/db'

export async function POST(req: NextRequest, res: NextResponse){
    const body = await req.json();
    const {firstname, lastname, address, email, contactno, password} = body;

      if (!password || !email) {
        return NextResponse.json({ error: "Please enter username, password, and email", status: 400 });
      }

    const user = {
        firstname: firstname,
        lastname: lastname,
        address: address,
        email: email,
        contactno: contactno,
        password: password,
    }

    const checkDupQuery = `
       SELECT id FROM users WHERE email = ${email} 
    `;

    const existingEmail = pool.query(checkDupQuery);
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered", statud: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    // const response = NextResponse.json({ message: "Logged in", user})

}

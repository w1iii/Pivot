
import {NextRequest, NextResponse} from "next/server";
import pool from '../../lib/db'
import bcrypt from 'bcrypt';

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

    // const existingEmail = pool.query(checkDupQuery);
    // if (existingEmail.rows.length()> 1) {
    //   return NextResponse.json({ error: "Email already registered", statud: 409 });
    // }

    const password_hash = await bcrypt.hash(password, 10);

    try{
      const addQuery = `
            INSERT INTO users(firstname, lastname, address, email, contactno, password, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, first_name, last_name;
          `;

      const newuser = pool.query(addQuery, [firstname, lastname, address, email, contactno, password])
          
      NextResponse.json({ 
        message: 'User added successfully,',
        user: newuser.rows[0]
    })
    }catch(e){
      console.log(e)
      NextResponse.json({ message: 'Insert user error', e})

  }
}


  




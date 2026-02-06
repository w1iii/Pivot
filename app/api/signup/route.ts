import {NextRequest, NextResponse} from "next/server";
import pool from '../../lib/db'
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest, res: NextResponse){
    const body = await req.json();
    const {firstname, lastname, address, email, contactno, password} = body;
    
    // Check if all required fields are provided
    if (!firstname || !lastname || !address || !email || !contactno || !password) {
        return NextResponse.json(
            { error: "Please fill up the form" }, 
            { status: 400 }
        );
    }
    
    // check email if duplicate
    try{
        const checkDupQuery = `
            SELECT id FROM users WHERE email = $1 
        `;
        const existingEmail = await pool.query(checkDupQuery, [email]);
        
        if (existingEmail.rows.length > 0) {
            return NextResponse.json(
                { error: "Email already registered" }, 
                { status: 409 }
            );
        }
    }catch(e: any){
        return NextResponse.json(
            { message: 'Database query error', error: e.message }, 
            { status: 500 }
        );
    }
    
    try{
        const checkDupQuery = `
            SELECT id FROM users WHERE contactno = $1 
        `;
        const existingContact = await pool.query(checkDupQuery, [contactno]);
        
        if (existingContact.rows.length > 0) {
            return NextResponse.json(
                { error: "Contact already registered" }, 
                { status: 409 }
            );
        }
    }catch(e: any){
        return NextResponse.json(
            { message: 'Database query error', error: e.message }, 
            { status: 500 }
        );
    }
    const password_hash = await bcrypt.hash(password, 10);
    
    // add user to database
    try{
        const addQuery = `
            INSERT INTO users(firstname, lastname, address, email, contactno, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, firstname, lastname;
        `;
        const newuser = await pool.query(addQuery, [firstname, lastname, address, email, contactno, password_hash])
        
        return NextResponse.json({ 
            message: 'User added successfully',
            user: newuser.rows[0]
        }, { status: 201 });
        
    }catch(e: any){
        return NextResponse.json(
            { message: 'Insert user error', error: e.message }, 
            { status: 500 }
        );
    }
}

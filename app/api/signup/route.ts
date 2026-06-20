import {NextRequest, NextResponse} from "next/server";
import pool from '../../lib/db'
import bcrypt from 'bcrypt';
import { generateToken } from '../../lib/auth/jwt';
import { rateLimit } from '../../lib/rate-limit';

export async function POST(req: NextRequest){
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const { allowed } = await rateLimit(`signup:${ip}`, { maxRequests: 3, interval: 300 });
    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many accounts. Try again later.' },
            { status: 429 }
        );
    }

    const body = await req.json();
    const {firstname, lastname, address, email, contactno, password} = body;
    
    if (!firstname || !lastname || !address || !email || !contactno || !password) {
        return NextResponse.json(
            { error: "Please fill up the form" }, 
            { status: 400 }
        );
    }

    if (password.length < 8) {
        return NextResponse.json(
            { error: "Password must be at least 8 characters" },
            { status: 400 }
        );
    }
    
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
    }catch(e){
        return NextResponse.json(
            { message: 'Database query error', error: e instanceof Error ? e.message : 'Unknown error' }, 
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
    }catch(e){
        return NextResponse.json(
            { message: 'Database query error', error: e instanceof Error ? e.message : 'Unknown error' }, 
            { status: 500 }
        );
    }
    const password_hash = await bcrypt.hash(password, 10);
    
    try{
        const addQuery = `
            INSERT INTO users(firstname, lastname, address, email, contactno, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, firstname, lastname;
        `;
        const newuser = await pool.query(addQuery, [firstname, lastname, address, email, contactno, password_hash])
        const user = newuser.rows[0];
        const token = await generateToken({ id: user.id, email: user.email });

        const response = NextResponse.json({
            message: 'User added successfully',
            user: { id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname }
        }, { status: 201 });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        return response;
        
    }catch(e){
        return NextResponse.json(
            { message: 'Insert user error', error: e instanceof Error ? e.message : 'Unknown error' }, 
            { status: 500 }
        );
    }
}

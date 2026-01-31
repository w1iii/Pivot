import pool from '../../lib/db'
import bcrypt from 'bcrypt'

interface User {
  id: number;
  email: string;
}

interface Result {
  success: boolean;
  user?: User;
  message?: string;
}

export async function checkLogin(email: string, password: string){
    try{
        // check correct email
        const checkuserQuery = `
            SELECT id, email, password_hash FROM users WHERE email = $1
        `
        const result = await pool.query(checkuserQuery, [email])
        if(result.rows.length === 0 ){
          return ({ success: false, message: "Invalid email or password" });

        }

        const user = result.rows[0]
        console.log(user)

        // check user password
        const isValidPassword = await bcrypt.compare(
          password,
          user.password_hash
        );

        if (!isValidPassword) {
          return ({ success: false, message: "Invalid email or password" });
        }

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
          },
        }
    }catch(e: any ){
        console.error("Login error:", e.message )
        return { success: false, message: "Server error" }
    }
}

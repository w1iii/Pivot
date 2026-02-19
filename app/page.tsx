"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link';
import './login.css'
import { useAuth } from './contexts/AuthContext'

export default function Home() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()

  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) =>{
    e.preventDefault()

    try{ 
      await login(email, password)
      router.push('/dashboard')
    }catch(err: any){
      setError(err.message)
    }
  }
  return (
    <>
      <div className="login-container">
        <div className="left-section">
          <h1>Pivot.</h1>
          <p> Welcome to Pivot. Cut through the noise and personalize your financial focus. Securely track your custom watchlist of stocks and crypto, get real-time quotes, and visualize performance with clean, interactive charts. Stop scrolling, start tracking—sign up today to make better-informed decisions.</p>
        </div>
        <div className="right-section">
          <div className="login-modal">
            <h2> Login </h2>
            {error && <p id="invalid-credentials"> {error} </p>}
            <form onSubmit={handleSubmit}>
              <input type="text" name="email" value={email} placeholder="email" onChange={(e) => setEmail(e.target.value)}/>
              <input type="password" name="password"  value={password} placeholder="password" onChange={(e) => setPassword(e.target.value)}/>
              <button type="submit"> submit </button>
            </form>
            <Link href="/signup" id="create-account"> Create account </Link>
          </div>
        </div>
      </div>

    </>
  );
}

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()

  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) =>{
    e.preventDefault()

    const res = await fetch('/api/login', {
      method: "POST",
      headers: { "Content-Type": "application/json", },
      body: JSON.stringify({ email: email, password: password})
    })

    if(res.ok){
      console.log("Login success")
      router.push('/dashboard')
      // const data = await res.json()
    }else{
      const data = await res.json()
      setError(data.message)
      console.error(data.message)
    }
  }
  return (
    <>
      <div className="left-section">
        <h1>Pivot.</h1>
        <p> Welcome to Pivot. Cut through the noise and personalize your financial focus. Securely track your custom watchlist of stocks and crypto, get real-time quotes, and visualize performance with clean, interactive charts. Stop scrolling, start tracking—sign up today to make better-informed decisions."</p>
      </div>
      <div className="right-section">
        <div className="login-container">
          <h2> Login </h2>
          {error && <p> {error} </p>}
          <form onSubmit={handleSubmit}>
            <input type="text" name="email" value={email} placeholder={email} onChange={(e) => setEmail(e.target.value)}/>
            <input type="password" name="password"  value={password} placeholder={password} onChange={(e) => setPassword(e.target.value)}/>
            <button type="submit"> submit </button>
          </form>
        </div>
      </div>

    </>
  );
}

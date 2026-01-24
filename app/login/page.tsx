"use client"

import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin =  async() => {
    console.log(username)
    const res = await fetch("/api/login", {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password}),
    })
    const data = await res.json();
    console.log(data)

    if(res.ok){
      router.push('/dashboard')
    }else {
      setError(data.message)
    }


  }

  return(
    <div>
      <h1>Login</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} style={{ marginLeft: "0.5rem" }}>
        Login
      </button>
      {error && <p> {error} </p>}
    </div>
  )
}


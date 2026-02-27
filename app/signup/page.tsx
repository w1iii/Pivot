"use client"

import { useState } from 'react'
import Link from 'next/link';
import './page.css'
import { useAuth } from '../contexts/AuthContext'

export default function SignUp(){
  const { signup } = useAuth()

  const [firstname, setFirst] = useState('')
  const [lastname, setLast] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [contactno, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [confirmpassword, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

const handleSubmit = async(e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setSuccess('')
  
  if(password !== confirmpassword){
    setError('Passwords do not match')
    return
  }

  setLoading(true)

  try{
      await signup(firstname, lastname, address, email, contactno, password )
      setLoading(false)
      setSuccess('Account created successfully!')
      
    }catch(e: unknown){
      const message = e instanceof Error ? e.message : 'Signup failed'
      setError(message)
      setLoading(false)
    }

  // try {
  //   const res = await fetch('/api/signup', {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ 
  //       firstname: firstname,
  //       lastname: lastname,
  //       address: address,
  //       email: email,
  //       contactno: contactno,
  //       password: password
  //     })
  //   })
  //
  //   if(res.status === 400){
  //     setError('Please fill up the form')
  //     setLoading(false)
  //     return
  //   }
  //   
  //   if(res.status === 409){
  //     const data = await res.json()
  //     setError(data.error)
  //     setLoading(false)
  //     return
  //   }
  //
  //   const data = await res.json()
  //
  //   if(res.ok){
  //     setSuccess('Account created successfully!')
  //     setFirst('')
  //     setLast('')
  //     setAddress('')
  //     setEmail('')
  //     setContact('')
  //     setPassword('')
  //     setConfirm('')
  //   } else {
  //     setError(data.message || 'Something went wrong')
  //   }
  // } catch(err) {
  //   setError('Network error. Please try again.')
  // } finally {
  //   setLoading(false)
  // }
}


  return (
    <div className="signup-container">
      <div className="signup-form-wrapper">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* First Name and Last Name Row */}
          <div className="form-row">
            <div className="form-field">
              <label>First name</label>
              <input 
                type="text" 
                value={firstname} 
                onChange={(e) => setFirst(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Last name</label>
              <input 
                type="text" 
                value={lastname} 
                onChange={(e) => setLast(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="form-field-full">
            <label>Address</label>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="form-field-full">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Contact No */}
          <div className="contact-field-wrapper">
            <div className="contact-field">
              <label>Contact no.</label>
              <input 
                type="tel" 
                value={contactno} 
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password and Re-enter Password Row */}
          <div className="form-row">
            <div className="form-field">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Re-enter Password</label>
              <input 
                type="password" 
                value={confirmpassword} 
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-wrapper">
            <button 
              type="submit" 
              disabled={loading}
              className={loading ? 'loading' : ''}
            >
              {loading ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
          </div>
        </form>
        <p className="login-navigation"> have an account? <Link href="/" id="login-link"> Login </Link> </p>
      </div>
    </div>
  )
}

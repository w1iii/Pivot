"use client"

import { useState } from 'react'
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function SignUp(){
  const { signup } = useAuth()
  const router = useRouter()

  const [firstname, setFirst] = useState('')
  const [lastname, setLast] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [contactno, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [confirmpassword, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

const handleSubmit = async(e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  if(password !== confirmpassword){
    setError('Passwords do not match')
    return
  }

  if(password.length < 8){
    setError('Password must be at least 8 characters')
    return
  }

  setLoading(true)

  try{
      await signup(firstname, lastname, address, email, contactno, password)
      router.push('/dashboard')
    }catch(e: unknown){
      const message = e instanceof Error ? e.message : 'Signup failed'
      setError(message)
      setLoading(false)
    }
}

  return (
    <>
      <main className="flex-grow flex items-center justify-center px-4 md:px-16 py-12">
        <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-center bg-surface-container-lowest editorial-shadow rounded-xl overflow-hidden border border-outline-variant">
          <div className="hidden lg:block h-[700px] relative overflow-hidden bg-primary-container">
            <img
              alt="System Reference"
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkbPz4KGW0MYWv7bCtWhJ2v6JK-zIF1TdA4PYni1__ZXqBmoC7jQ5Nddbbae2cL4Ya8aEN1c5OaXGJ4TCT1fiRHiu0SangBqjDZAB6gb7L64ZiJOiWwYNwkmAqG_BPVQRC3b7JWGXlr3P81wNbe7O5Wu1mMfsyAlyuwViEzjHoxRnkb_GYvJCJk0h8Pk8wTDffonKTmvGR57GvBomRhcU1JP0GjatW9JUTzVTRsSuTK-kR9lPZReznhwH2ZivPYSH-hwOa2GLYILQ"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
            <div className="absolute bottom-12 left-12 right-12 text-on-primary-container">
              <h2 className="text-headline-xl font-headline-xl mb-4">Precision Analysis for Institutional Assets.</h2>
              <p className="text-body-lg opacity-80 max-w-md">Access the high-performance trading infrastructure designed for professional market participants.</p>
            </div>
          </div>
          <div className="p-8 md:p-16 flex flex-col items-center">
            <div className="w-full max-w-sm">
              <div className="mb-10 text-center lg:text-left">
                <span className="text-headline-lg font-headline-lg font-bold text-primary tracking-tighter block mb-2">Pivot</span>
                <p className="text-on-surface-variant text-label-md">Register for a new terminal account.</p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-lg bg-error-container/20 border border-error/30">
                  <p className="text-error text-body-sm">{error}</p>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="firstname">First Name</label>
                    <input
                      className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 text-body-md text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                      id="firstname"
                      name="firstname"
                      type="text"
                      placeholder="John"
                      value={firstname}
                      onChange={(e) => setFirst(e.target.value)}
                      required
                    />
                  </div>
                  <div className="group">
                    <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="lastname">Last Name</label>
                    <input
                      className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 text-body-md text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                      id="lastname"
                      name="lastname"
                      type="text"
                      placeholder="Doe"
                      value={lastname}
                      onChange={(e) => setLast(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="address">Address</label>
                  <input
                    className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 text-body-md text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                    id="address"
                    name="address"
                    type="text"
                    placeholder="123 Main Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="email">Email Address</label>
                  <input
                    className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 text-body-md text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@firm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="contactno">Contact No.</label>
                  <input
                    className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 text-body-md text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                    id="contactno"
                    name="contactno"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={contactno}
                    onChange={(e) => setContact(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="password">Password</label>
                    <div className="relative">
                      <input
                        className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 text-body-md text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="confirmpassword">Confirm Password</label>
                    <input
                      className="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant py-3 px-0 text-body-md text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                      id="confirmpassword"
                      name="confirmpassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmpassword}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary py-4 rounded-lg text-label-md uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register Account'}
                  </button>
                </div>
              </form>

              <div className="mt-10 text-center">
                <p className="text-body-md text-on-surface-variant">
                  Already have an account?
                  <Link href="/" className="text-primary text-label-md font-bold hover:underline ml-1">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-4 md:px-16 py-2 border-t border-outline-variant bg-surface">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <span className="text-label-sm text-outline">© 2024 PIVOT INSTITUTIONAL</span>
            <span className="text-label-sm text-outline">SEC/FINRA REGISTERED</span>
          </div>
          <div className="flex gap-4">
            <a className="text-label-sm text-outline hover:text-primary transition-colors uppercase tracking-widest" href="#">Legal</a>
            <a className="text-label-sm text-outline hover:text-primary transition-colors uppercase tracking-widest" href="#">Privacy</a>
            <a className="text-label-sm text-outline hover:text-primary transition-colors uppercase tracking-widest" href="#">Security</a>
          </div>
        </div>
      </footer>
    </>
  )
}

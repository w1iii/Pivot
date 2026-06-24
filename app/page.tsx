"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link';
import { useAuth } from './contexts/AuthContext'

export default function Home() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) =>{
    e.preventDefault()
    setError('')
    setLoading(true)

    try{ 
      await login(email, password)
      router.push('/dashboard')
    }catch(_err: unknown){
      const message = _err instanceof Error ? _err.message : 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="flex-grow flex items-center justify-center px-4 md:px-16 py-12">
        <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-center bg-surface-container-lowest editorial-shadow rounded-xl overflow-hidden border border-outline-variant">
          <div className="hidden lg:block h-[600px] relative overflow-hidden bg-primary-container">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-container to-surface-container-low" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, currentColor 1px, transparent 0)', backgroundSize: '50px 50px' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
            <div className="absolute bottom-12 left-12 right-12 text-on-primary-container">
              <h2 className="text-headline-xl font-headline-xl mb-4">Precision Analysis for Institutional Assets.</h2>
              <p className="text-body-lg opacity-80 max-w-md">Access the high-performance trading infrastructure designed for professional market participants.</p>
            </div>
          </div>
          <div className="p-8 md:p-16 flex flex-col items-center">
            <div className="w-full max-w-sm">
              <div className="mb-12 text-center lg:text-left">
                <span className="text-headline-lg font-headline-lg font-bold text-primary tracking-tighter block mb-2">Pivot</span>
                <p className="text-on-surface-variant text-label-md">Please enter your credentials to access the terminal.</p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-lg bg-error-container/20 border border-error/30">
                  <p className="text-error text-body-sm">{error}</p>
                </div>
              )}

              <form className="space-y-8" onSubmit={handleSubmit}>
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant" htmlFor="password">Password</label>
                    <a className="text-primary text-label-sm hover:underline cursor-pointer" onClick={(e) => { e.preventDefault(); alert('Password reset functionality coming soon.'); }}>Forgot password?</a>
                  </div>
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

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary py-4 rounded-lg text-label-md uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Authorizing...' : 'Authorize Session'}
                  </button>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-grow bg-outline-variant"></div>
                  <span className="text-label-sm text-outline uppercase tracking-tighter">or authenticate via</span>
                  <div className="h-px flex-grow bg-outline-variant"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => alert('SSO integration coming soon.')} className="flex items-center justify-center gap-2 border border-outline-variant py-3 rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"></path>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"></path>
                    </svg>
                    SSO
                  </button>
                  <button type="button" onClick={() => alert('Passkey authentication coming soon.')} className="flex items-center justify-center gap-2 border border-outline-variant py-3 rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-[20px]">key</span>
                    Passkey
                  </button>
                </div>
              </form>

              <div className="mt-12 text-center">
                <p className="text-body-md text-on-surface-variant">
                  New to the platform?
                  <Link href="/signup" className="text-primary text-label-md font-bold hover:underline ml-1">Request access</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-4 md:px-16 py-2 border-t border-outline-variant bg-surface">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <span className="text-label-sm text-outline">© {new Date().getFullYear()} PIVOT INSTITUTIONAL</span>
            <span className="text-label-sm text-outline">SEC/FINRA REGISTERED</span>
          </div>
          <div className="flex gap-4">
            <a className="text-label-sm text-outline hover:text-primary transition-colors uppercase tracking-widest cursor-pointer" onClick={() => alert('Legal information coming soon.')}>Legal</a>
            <a className="text-label-sm text-outline hover:text-primary transition-colors uppercase tracking-widest cursor-pointer" onClick={() => alert('Privacy policy coming soon.')}>Privacy</a>
            <a className="text-label-sm text-outline hover:text-primary transition-colors uppercase tracking-widest cursor-pointer" onClick={() => alert('Security information coming soon.')}>Security</a>
          </div>
        </div>
      </footer>
    </>
  )
}

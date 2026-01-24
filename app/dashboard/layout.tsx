
"use client"

import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from 'react';
import { useState } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState('')
  const router = useRouter()

  useEffect(()=>{
    const user = localStorage.getItem("user")
    if (!user) router.push('/login')
    else setUser(user)
  }, [router])

  if (!user) {
    return null
  }

  return (
    <div>
      <nav style={{ marginBottom: "1rem" }}>
        <strong>Dashboard Menu:</strong>{" "}
        <Link href="/dashboard">Home</Link> | <Link href="/dashboard/settings">Settings</Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}

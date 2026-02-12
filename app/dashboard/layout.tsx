
"use client"

import './page.css';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  return (
    <div>
     <div>{children}</div>
    </div>
  );
}

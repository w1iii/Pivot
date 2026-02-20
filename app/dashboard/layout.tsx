
"use client"

import './page.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  return (
    <div>
     <div>{children}</div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const loggedUser = localStorage.getItem("user");
    if (!loggedUser) router.push("/login");
    else setUser(loggedUser);
  }, [router]);

  if (!user) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user}!</p>
    </div>
  );
}


// app/components/Navbar.tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav >
      <Link href="/">Home</Link> |{" "}
      <Link href="/dashboard">Dashboard</Link> |{" "}
      <Link href="/login">Login</Link>
    </nav>
  );
}

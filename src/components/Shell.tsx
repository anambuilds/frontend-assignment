"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, LayoutDashboard, LogOut, Package2 } from "lucide-react";
import { clearSession, getSession } from "@/lib/api";

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = getSession();
  function logout() {
    clearSession();
    router.replace("/login");
    router.refresh();
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/products" className="brand"><span className="brand-mark"><Boxes size={22} strokeWidth={2.4} /></span><span>northstar<span className="brand-dot">.</span></span></Link>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav aria-label="Main navigation"><Link className="nav-link active" href="/products"><LayoutDashboard size={19} /> Products</Link></nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><Package2 size={20} /><strong>Stay in the know</strong><span>All your product details in one tidy place.</span></div><div className="sidebar-user"><span className="avatar">{session?.firstName?.charAt(0) || "E"}</span><div><strong>{session ? `${session.firstName} ${session.lastName}` : "Your account"}</strong><span>Administrator</span></div><button className="icon-button" aria-label="Log out" title="Log out" onClick={logout}><LogOut size={18} /></button></div></div>
    </aside>
    <div className="shell-main"><header className="topbar"><div className="mobile-brand brand"><span className="brand-mark"><Boxes size={20} /></span><span>northstar<span className="brand-dot">.</span></span></div><span className="topbar-label">Product workspace</span><div className="topbar-right"><span className="topbar-greeting">Hello, {session?.firstName || "there"}</span><span className="avatar small">{session?.firstName?.charAt(0) || "E"}</span><button className="mobile-logout icon-button" aria-label="Log out" onClick={logout}><LogOut size={18} /></button></div></header><div className="page-content">{children}</div></div>
  </div>;
}

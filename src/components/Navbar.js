"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Calendar,
  CheckSquare,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  PawPrint,
  MessageSquare,
  Cat,
  ShoppingBasket,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("auth-change", checkAuth);
    };
  }, [pathname]); // Re-check auth when route changes

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);

      // Dispatch custom event for auth change
      window.dispatchEvent(new Event("auth-change"));

      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAuthClick = async () => {
    if (user) {
      await handleLogout();
      return;
    }
    router.push("/login");
  };

  // Don't show navbar on auth pages
  const authPages = ["/login", "/signup", "/accept-invite"];
  if (authPages.some((page) => pathname?.startsWith(page))) {
    return null;
  }

  if (loading) {
    return (
      <aside className="brada-font fixed top-0 left-0 z-40 h-full w-20 lg:w-64 bg-[#f2f4ee] text-[#697a63] rounded-xl">
        <div className="p-6">
          <div className="animate-pulse bg-[#d4dbce] h-8 w-24 rounded" />
        </div>
      </aside>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Pets", href: "/pets", icon: PawPrint },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Care Plan", href: "/care-plan", icon: CheckSquare },
    { name: "Chats", href: "/pettrack", icon: MessageSquare },
    { name: "Shopping", href: "shopping", icon: ShoppingBasket },
  ];

  const userItems = [
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      <div className="sm:hidden p-3">
        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="brada-font fixed top-4 right-4 z-50 bg-white rounded shadow p-2 text-[#697a63]"
          aria-label="Toggle sidebar"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <button
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`brada-font fixed top-0 left-0 z-40 h-full w-20 lg:w-64 rounded-xl flex flex-col text-[#697a63] bg-[#f2f4ee] transition-transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <a href="/" className="flex items-center gap-3 px-6 py-4 border-b border-[#d4dbce]">
          <Cat size={32} />
          <span className="text-xl font-semibold hidden lg:inline">PetCare</span>
        </a>

        <nav className="flex flex-col flex-1 px-4 py-6 space-y-6">
          <div>
            <p className="text-[#b4bfae] text-xs mb-2 hidden lg:block">MENU</p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive ? "bg-[#dbe1d4] font-medium" : "hover:bg-[#dbe1d4]"
                    }`}
                  >
                    <Icon size={22} />
                    <span className="hidden lg:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[#b4bfae] text-xs mb-2 hidden lg:block">USER</p>
            <div className="space-y-1">
              {userItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive ? "bg-[#dbe1d4] font-medium" : "hover:bg-[#dbe1d4]"
                    }`}
                  >
                    <Icon size={22} />
                    <span className="hidden lg:inline">{item.name}</span>
                  </Link>
                );
              })}

              <button
                onClick={handleAuthClick}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#dbe1d4] transition"
              >
                {user ? <LogOut size={22} /> : <LogIn size={22} />}
                <span className="hidden lg:inline">
                  {user ? "Sign Out" : "Sign In"}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#dbe1d4]">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user?.name || "User"} avatar`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#697a63] text-white flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase() || "G"}
              </div>
            )}
            <div className="hidden lg:block min-w-0">
              <p className="font-semibold truncate">{user?.name || "Guest"}</p>
              <p
                className="text-sm truncate"
                title={user?.email || "Not signed in"}
              >
                {user?.email || "Not signed in"}
              </p>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

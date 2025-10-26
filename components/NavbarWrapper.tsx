"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

const hideNavbarPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];

export function NavbarWrapper() {
  const pathname = usePathname();
  if (hideNavbarPaths.includes(pathname)) return null;
  return <Navbar />;
}

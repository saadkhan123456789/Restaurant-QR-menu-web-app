import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "admin_logged_in";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admi123";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function loginAdmin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Redirects to /admin/login if not logged in. Returns true once the check
 * has passed, so callers can hold off rendering protected content until then.
 */
export function useRequireAdmin(): boolean {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setAuthorized(true);
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  return authorized;
}

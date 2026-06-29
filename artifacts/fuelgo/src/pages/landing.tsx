import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function Landing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === 'admin') setLocation('/admin/dashboard');
    else setLocation('/admin/login');
  }, [user, setLocation]);

  return null;
}

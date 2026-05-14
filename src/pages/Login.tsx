import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../store/AppContext";
import { Smartphone, Lock, User, AlertCircle } from "lucide-react";

export default function Login() {
  const { state, dispatch } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // In a real app, we'd use this. For mock, we'll just check email.
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const user = state.users.find((u) => u.email === email);
      
      // If user exists but has no password set, allow login with default password '123456'
      const isPasswordValid = user && (user.password === password || (!user.password && password === '123456'));

      if (user && isPasswordValid) {
        dispatch({ type: "SET_USER", payload: user });
        // Persist to localStorage
        localStorage.setItem("phonehouse_user", JSON.stringify(user));
        localStorage.removeItem("phonehouse_original_admin");
      } else {
        setError("Email hoặc mật khẩu không chính xác.");
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 mb-4">
            <Smartphone className="w-8 h-8 text-neon-cyan" />
          </div>
          <Link to="/">
            <h1 className="text-3xl font-bold text-neon-cyan tracking-tight neon-text">
              Phone House
            </h1>
          </Link>
          <p className="text-dark-muted mt-2">
            Hệ thống quản lý kỹ thuật & kho máy
          </p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-dark-text mb-6">Đăng nhập nhân viên</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-neon-pink/10 border border-neon-pink/20 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-neon-pink mr-3 shrink-0 mt-0.5" />
              <p className="text-sm text-neon-pink">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1.5">Email nhân viên</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:ring-2 focus:ring-neon-cyan focus:border-transparent outline-none transition-all"
                  placeholder="name@ifix.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-dark-muted mt-1.5 ml-1">
                Gợi ý: admin@ifix.vn, kta@ifix.vn, sale@ifix.vn. Mật khẩu mặc định: 123456
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:ring-2 focus:ring-neon-cyan focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-neon-cyan text-dark-bg font-bold rounded-xl hover:bg-neon-cyan/90 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-dark-muted text-xs mt-8">
          &copy; 2024 Phone House Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}

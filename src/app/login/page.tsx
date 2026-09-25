"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const busy = useRef(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password);
      router.replace("/products");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in. Please try again.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="login-layout">
      <section className="login-story" aria-label="Welcome to Northstar">
        <div className="brand brand-light">
          <span className="brand-mark">
            <Boxes size={22} strokeWidth={2.4} />
          </span>
          <span>
            northstar<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="story-content">
          <span className="story-kicker">
            <Sparkles size={16} /> YOUR CATALOG, IN CONTROL
          </span>
          <h1>A clearer view of everything you sell.</h1>
          <p>Manage products, make changes, and find what matters, all from one calm workspace.</p>
          <div className="story-preview" aria-hidden="true">
            <div className="preview-header">
              <span className="preview-sun" /> Overview <span className="preview-dots">•••</span>
            </div>
            <div className="preview-numbers">
              <div>
                <small>PRODUCTS</small>
                <strong>194</strong>
                <span>Across your catalog</span>
              </div>
              <div>
                <small>ON TRACK</small>
                <strong>98%</strong>
                <span>Looking good today</span>
              </div>
            </div>
            <div className="preview-bars">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
        <p className="story-footer">A little more clarity for the work you do every day.</p>
      </section>
      <section className="login-panel">
        <div className="mobile-brand brand">
          <span className="brand-mark">
            <Boxes size={22} />
          </span>
          <span>
            northstar<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="login-card">
          <div className="login-icon">
            <LockKeyhole size={24} />
          </div>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your workspace</h2>
          <p className="subtle">Your products are right where you left them.</p>
          <form onSubmit={submit} className="login-form">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              required
            />
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <div className="alert error" role="alert">
                {error}
              </div>
            )}
            <button className="button button-primary login-button" type="submit" disabled={loading}>
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className="demo-note">
            <ShieldCheck size={19} />
            <div>
              <strong>Trying the demo?</strong>
              <span>
                Use <b>emilys</b> and <b>emilyspass</b> to sign in.
              </span>
            </div>
          </div>
        </div>
        <p className="login-legal">Built for a simpler product workflow.</p>
      </section>
    </main>
  );
}

import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import API_URL from '../config';
import GitHubMark from './shared/GitHubMark';

export default function Login({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      // role is intentionally excluded from signup — all new users are members
      const payload = isLogin ? { email, password } : { name, email, password };

      const { data } = await axios.post(`${API_URL}${endpoint}`, payload);

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Successfully logged in!');
      } else {
        setIsLogin(true);
        toast.success('Signup successful! Please login.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="auth-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-panel auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <button className="icon-button icon-button--brand auth-brand-icon" type="button" aria-label="GitHub home">
            <GitHubMark width="22" height="22" />
          </button>
        </div>
        <h2 className="logo" style={{ textAlign: 'center', marginBottom: '8px' }}>Team Task Manager</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Welcome back to your workspace' : 'Create your workspace account'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="input-with-icon"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              className="input-with-icon"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              className="input-with-icon"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn--primary btn--full" style={{ marginTop: '8px' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <span style={{ color: 'var(--color-fg-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <span
            className="auth-toggle-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

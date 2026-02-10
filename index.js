import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState(null);
  const router = useRouter();

  const login = async (e) => {
    e.preventDefault();
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
      const res = await axios.post(`${base}/api/auth/login`, { username, password });
      localStorage.setItem('uls_token', res.data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="page center">
      <div className="card">
        <h2>ULS Login</h2>
        <form onSubmit={login}>
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit">Login</button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

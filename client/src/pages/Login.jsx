import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm">
        <h2 className="text-3xl font-sora font-bold text-text mb-2 text-center">Welcome Back</h2>
        <p className="text-text-muted text-center mb-10">Log in to your account</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2">Email</label>
            <input 
              type="email" 
              inputMode="email"
              autoComplete="email"
              required
              className="w-full h-14 px-4 bg-surface border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                className="w-full h-14 pl-4 pr-12 bg-surface border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="text-sos text-sm mt-2">{error}</p>}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-[56px] bg-brand text-bg font-bold rounded-DEFAULT hover:bg-brand/90 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="text-center text-text-muted mt-8">
          Don't have an account? <Link to="/register" className="text-brand font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

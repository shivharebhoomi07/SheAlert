import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(name, email, password, phone);
      navigate('/');
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && serverErrors.length > 0) {
        setError(serverErrors[0].msg);
      } else {
        setError(err.response?.data?.message || 'Failed to register.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm">
        <h2 className="text-3xl font-sora font-bold text-text mb-2 text-center">Create Account</h2>
        <p className="text-text-muted text-center mb-10">Join SheAlert</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2">Name</label>
            <input 
              type="text" 
              required
              className="w-full h-14 px-4 bg-surface border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
            <label className="block text-sm font-bold text-text-muted mb-2">Phone</label>
            <input 
              type="tel" 
              inputMode="tel"
              autoComplete="tel"
              required
              className="w-full h-14 px-4 bg-surface border border-line rounded-DEFAULT text-text outline-none focus:border-brand transition-colors"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-text-muted mt-8">
          Already have an account? <Link to="/login" className="text-brand font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

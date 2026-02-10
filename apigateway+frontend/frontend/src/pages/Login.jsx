import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();
const apiUrl = (path) => {
  if (!API_BASE_URL) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

const Login = () => {
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    setAuthError('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/auth'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setAuthError(data?.error || 'Invalid password');
        return;
      }

      const token = data?.token || '';
      localStorage.setItem('mh_token', token);
      navigate('/chat');
    } catch (error) {
      setAuthError(`Connection error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && password.trim() && !isLoading) {
      login();
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4 md:p-8"
      style={{
        backgroundImage: `
        linear-gradient(rgba(245, 241, 232, 0.95), rgba(245, 241, 232, 0.95)),
        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b8956a' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
      `,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Spectral:wght@400;600;700&display=swap');
        
        * {
          font-family: 'Spectral', serif;
        }
        
        .title-font {
          font-family: 'Cormorant Garamond', serif;
          letter-spacing: 0.02em;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
        
        .slide-down {
          animation: slideDown 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
        
        .parchment-shadow-lg {
          box-shadow: 
            0 4px 12px rgba(120, 80, 40, 0.08),
            0 2px 4px rgba(120, 80, 40, 0.06);
        }
        
        .ornament {
          width: 60px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c4a574 50%, transparent);
        }
        
        .login-input {
          transition: all 0.2s ease;
        }
        
        .login-input:focus {
          box-shadow: 0 0 0 1px #8b6f47;
        }
        
        .login-btn {
          transition: all 0.2s ease;
        }
        
        .login-btn:hover:not(:disabled) {
          background: #efe7d9;
        }
        
        .login-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .error-message {
          animation: fadeIn 0.4s ease;
        }
      `}</style>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 slide-down">
          <h1 className="title-font text-4xl md:text-5xl font-semibold text-[#4a3526] mb-4 tracking-wide">
            Machina Hankinsiana
          </h1>
          <div className="ornament mx-auto mb-4"></div>
          <p className="text-[#8b7355] text-sm italic">
            Enter password to continue
          </p>
        </div>

        {/* Login Card */}
        <div
          className="bg-[#fdfbf7] rounded-lg parchment-shadow-lg p-6 md:p-10 border border-[#d4c4a8] fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Form Content */}
          <div className="w-full mx-auto" style={{ maxWidth: '300px' }}>
            {/* Password Input */}
            <div className="mb-5">
              <label className="block text-[#4a3526] font-medium mb-2 text-sm">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter password"
                className="login-input w-full px-3 py-2.5 rounded-md border border-[#d4c4a8] bg-white text-[#4a3526] text-sm placeholder-[#b8a593] focus:border-[#8b6f47] focus:ring-1 focus:ring-[#8b6f47]/20 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {authError && (
              <div className="error-message mb-4 p-3 bg-[#fef2f2] border-l-2 border-[#dc2626] rounded-r">
                <p className="text-xs text-[#991b1b]">{authError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={login}
              type="button"
              disabled={!password.trim() || isLoading}
              className="login-btn w-full bg-[#f5f1e8] text-[#4a3526] py-2.5 px-8 rounded-md font-medium border border-[#d4c4a8] disabled:opacity-40 disabled:cursor-not-allowed title-font text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-[#4a3526]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Enter the Archive'
              )}
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-center mt-6 text-xs text-[#a89278] italic">
            Access granted to verified scholars only
          </p>
        </div>

        {/* Footer */}
        <footer
          className="text-center mt-8 fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          <p className="text-xs text-[#a89278]">
            A tribute created with appreciation and admiration • 2026
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;

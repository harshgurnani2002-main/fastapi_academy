'use client';

// Note: Next.js App Router does not allow exporting metadata from a 'use client' component.
// In a production app, move this metadata export to a layout.tsx file.
/*
export const metadata = {
  title: 'Sign In | FastAPI Mastery',
}
*/

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import { useAuthStore } from '@/stores/useAuthStore';

// Mock hook for demonstration
const useAuthStore = () => ({
  login: async () => { /* mock login */ },
  loginWithGoogle: async () => { /* mock google login */ }
});

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login();
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-950 font-sans text-neutral-100">
      
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative">
        {/* Brand / Logo */}
        <div className="absolute top-8 left-8 sm:left-16 md:left-24 xl:left-32 text-xl font-bold tracking-tight text-white">
          FastAPI <span className="text-orange-500">Mastery</span>
        </div>

        <div className="max-w-sm w-full mx-auto mt-16">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="text-orange-500">Ship production APIs.</span>
          </h1>
          <p className="text-neutral-400 mb-8">Join thousands of engineers mastering FastAPI.</p>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-neutral-100 text-neutral-900 font-medium py-2.5 px-4 rounded-lg transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center space-x-4 mb-6">
            <hr className="flex-1 border-neutral-800" />
            <span className="text-xs text-neutral-500 uppercase tracking-wider">or continue with email</span>
            <hr className="flex-1 border-neutral-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1" htmlFor="email">Email address</label>
              <input 
                id="email"
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="developer@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1" htmlFor="password">Password</label>
              <input 
                id="password"
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-neutral-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-neutral-900 bg-neutral-900" 
                />
                <span className="text-sm text-neutral-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-orange-500 hover:text-orange-400">Forgot password?</a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-2.5 rounded-lg transition-colors mt-6 disabled:opacity-70 flex justify-center items-center"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500">
            No account? <Link href="/register" className="text-orange-500 hover:text-orange-400">Start for free</Link>
          </p>
        </div>
      </div>

      {/* Right side: Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d1117] items-center justify-center p-12 relative overflow-hidden border-l border-neutral-800">
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Floating Badges */}
        <div className="absolute top-24 right-24 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 shadow-xl animate-bounce" style={{animationDuration: '3s'}}>
          <span>⚡</span> <span>FastAPI</span>
        </div>
        <div className="absolute bottom-32 left-16 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 shadow-xl animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
          <span>🐘</span> <span>PostgreSQL</span>
        </div>
        <div className="absolute top-1/3 right-12 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 shadow-xl animate-bounce" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}>
          <span>🔴</span> <span>Redis</span>
        </div>

        {/* Code Terminal */}
        <div className="w-full max-w-lg bg-[#161b22] rounded-xl border border-neutral-800 shadow-2xl overflow-hidden z-10">
          <div className="flex items-center px-4 py-3 bg-[#0d1117] border-b border-neutral-800">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="mx-auto text-xs text-neutral-500 font-mono">main.py</div>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-sm font-mono leading-relaxed">
              <code className="text-neutral-300">
                <span className="text-neutral-500 italic"># You're one step away from</span><br/>
                <span className="text-neutral-500 italic"># mastering production FastAPI</span><br/>
                <br/>
                <span className="text-pink-400">from</span> fastapi <span className="text-pink-400">import</span> FastAPI, Depends<br/>
                <span className="text-pink-400">from</span> app.auth <span className="text-pink-400">import</span> get_current_user<br/>
                <span className="text-pink-400">from</span> app.db <span className="text-pink-400">import</span> AsyncSession<br/>
                <br/>
                app = FastAPI()<br/>
                <br/>
                <span className="text-yellow-300">@app.get</span>(<span className="text-green-400">'/api/v1/users/me'</span>)<br/>
                <span className="text-pink-400">async def</span> <span className="text-blue-400">get_profile</span>(<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;current_user = Depends(get_current_user),<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;db: AsyncSession = Depends(get_db),<br/>
                ) -&gt; UserResponse:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">return await</span> UserService.get_profile(<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;user_id=current_user.id,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;db=db,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;)<br/>
              </code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

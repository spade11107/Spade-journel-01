import { useState, FormEvent } from 'react';
import { Spade, Mail, Lock, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.06),transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-2xl shadow-blue-600/30 mb-4 animate-pulse-slow">
            <Spade size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SPADE</h1>
          <p className="text-sm text-zinc-500 mt-1 uppercase tracking-widest">Track. Analyze. Improve.</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg mb-6">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'signin' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'signup' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 z-10" />
              <Input
                type="email"
                name="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 z-10" />
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-10"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
              <TrendingUp size={14} />
              <span>ICT / SMC / Price Action Trading Journal</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Your trading data is private and secure. Each account only sees its own trades.
        </p>
      </div>
    </div>
  );
}

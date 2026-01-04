import React, { useState } from 'react';
import { authService } from '../services/api';
import { Lock, Mail, Loader2, AlertCircle, Globe, ShieldCheck, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

interface LoginPageProps {
    onLoginSuccess: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authMethod, setAuthMethod] = useState<'local' | 'google'>('google');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState<string | null>(null);

    const handleLocalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await authService.login(email, password);

            if (response.mfa_required) {
                setMfaRequired(true);
                setMfaToken(response.mfa_token);
            } else {
                const user = await authService.getMe();
                onLoginSuccess(user);
            }
        } catch (err: any) {
            console.error('Local login failed:', err);
            setError(err.response?.data?.detail || 'Invalid credentials. Please use your registered Gmail account.');
        } finally {
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mfaToken) return;

        setLoading(true);
        setError(null);

        try {
            await authService.verifyMFA(mfaCode, mfaToken);
            const user = await authService.getMe();
            onLoginSuccess(user);
        } catch (err: any) {
            console.error('MFA verification failed:', err);
            setError(err.response?.data?.detail || 'Invalid MFA code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError(null);
        try {
            if (credentialResponse.credential) {
                await authService.loginWithGoogle(credentialResponse.credential);
                const user = await authService.getMe();
                onLoginSuccess(user);
            }
        } catch (err: any) {
            console.error('Google login failed:', err);
            setError(err.response?.data?.detail || 'Google authentication failed. Ensure your email is authorized.');
        } finally {
            setLoading(false);
        }
    };

    const resetMfa = () => {
        setMfaRequired(false);
        setMfaToken(null);
        setMfaCode('');
        setError(null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-hku-warning" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-hku-green/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-hku-warning/5 rounded-full blur-3xl" />

            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-hku-green rounded-2xl shadow-xl mb-4 transform hover:rotate-3 transition-transform">
                        <span className="text-white font-bold text-3xl italic">HKU</span>
                    </div>
                    <h1 className="text-3xl font-serif font-black text-hku-green tracking-tight mb-1 uppercase">CRAS</h1>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Clinical Research Access System</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-hku-green/5 rounded-bl-[100px]" />

                    {/* Auth Method Toggle (Hidden in MFA mode) */}
                    {!mfaRequired && (
                        <div className="flex p-1 bg-gray-100 rounded-2xl mb-8 relative z-10">
                            <button
                                onClick={() => setAuthMethod('google')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${authMethod === 'google' ? 'bg-white shadow-sm text-hku-green' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                Google Auth
                            </button>
                            <button
                                onClick={() => setAuthMethod('local')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${authMethod === 'local' ? 'bg-white shadow-sm text-hku-green' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                Local Login
                            </button>
                        </div>
                    )}

                    <div className="relative z-10">
                        {mfaRequired ? (
                            /* MFA Challenge Screen */
                            <form onSubmit={handleMfaSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center space-y-2 mb-6">
                                    <div className="w-12 h-12 bg-hku-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="w-6 h-6 text-hku-warning" />
                                    </div>
                                    <h3 className="font-serif font-bold text-hku-green text-xl">Verification Required</h3>
                                    <p className="text-xs text-gray-400 max-w-[240px] mx-auto">Please enter the 6-digit security code from your authenticator app.</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <ShieldCheck className="h-5 w-5 text-gray-400 group-focus-within:text-hku-green transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            required
                                            autoFocus
                                            value={mfaCode}
                                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                            className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-hku-green focus:bg-white transition-all outline-none text-center text-2xl font-bold tracking-[0.5em] placeholder:text-gray-200"
                                            placeholder="000000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={loading || mfaCode.length !== 6}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-hku-green text-white rounded-xl font-bold shadow-lg shadow-hku-green/20 hover:bg-hku-green/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Identity"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={resetMfa}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-400 hover:text-hku-green transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to login
                                    </button>
                                </div>
                            </form>
                        ) : authMethod === 'google' ? (
                            /* Google Auth Selection */
                            <div className="space-y-6 flex flex-col items-center py-4">
                                <div className="text-center space-y-2 mb-2">
                                    <h3 className="font-serif font-bold text-hku-green">Institution Credentials</h3>
                                    <p className="text-xs text-gray-400 max-w-[200px] mx-auto">Use your primary institution email to authenticate via Google.</p>
                                </div>
                                <div className="w-full flex justify-center">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Google sign-in was unsuccessful.')}
                                        theme="outline"
                                        size="large"
                                        width="100%"
                                        shape="pill"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Local Login Selection */
                            <form onSubmit={handleLocalSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-hku-green/70 ml-1">Gmail Account</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-hku-green transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-hku-green focus:bg-white transition-all outline-none text-sm placeholder:text-gray-400"
                                            placeholder="your-gmail@gmail.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-hku-green/70 ml-1">Security Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-hku-green transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-hku-green focus:bg-white transition-all outline-none text-sm placeholder:text-gray-400"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-hku-green text-white rounded-xl font-bold shadow-lg shadow-hku-green/20 hover:bg-hku-green/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Authenticate Local"
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2 relative z-10">
                            <AlertCircle className="h-5 w-5 text-hku-error shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium leading-relaxed">
                        Authorized Personnel Only<br />
                        <span className="opacity-50">PART 11 COMPLIANT SECURITY PROTOCOLS IN EFFECT</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

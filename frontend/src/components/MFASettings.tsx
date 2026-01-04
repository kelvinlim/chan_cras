import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldCheck, ShieldAlert, Loader2, AlertCircle, Copy, Check } from 'lucide-react';

interface MFASettingsProps {
    user: any;
    onRefresh: () => void;
}

const MFASettings: React.FC<MFASettingsProps> = ({ user, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState<{ secret: string; provisioning_uri: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleInitiateSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.setupMFA();
            setSetupData(data);
        } catch (err: any) {
            setError('Failed to initiate MFA setup. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await authService.enableMFA(verificationCode);
            setSetupData(null);
            setVerificationCode('');
            onRefresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid verification code.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!window.confirm('Are you sure you want to disable Multi-Factor Authentication? your account will be less secure.')) return;

        setLoading(true);
        try {
            await authService.disableMFA();
            onRefresh();
        } catch (err: any) {
            setError('Failed to disable MFA.');
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        if (!setupData) return;
        navigator.clipboard.writeText(setupData.secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-hku-green/5 rounded-bl-[100px]" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className={`p-4 rounded-2xl ${user.mfa_enabled ? 'bg-hku-green/10 text-hku-green' : 'bg-gray-100 text-gray-400'}`}>
                        {user.mfa_enabled ? <ShieldCheck className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-black text-hku-green tracking-tight uppercase">Identity Security</h2>
                        <p className="text-sm text-gray-500 font-medium">Multi-Factor Authentication (TOTP)</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${user.mfa_enabled ? 'bg-hku-green text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {user.mfa_enabled ? 'Protected' : 'Standard Access'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Info/Status */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-hku-green/70 mb-4">Status</h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to log in.
                        </p>
                        {user.mfa_enabled ? (
                            <button
                                onClick={handleDisable}
                                disabled={loading}
                                className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                                Disable MFA
                            </button>
                        ) : (
                            <button
                                onClick={handleInitiateSetup}
                                disabled={loading || setupData !== null}
                                className="w-full py-3 bg-hku-green text-white rounded-xl text-sm font-bold shadow-lg shadow-hku-green/20 hover:bg-hku-green/90 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                Enable MFA
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Setup Flow */}
                <div className="md:col-span-2">
                    {setupData ? (
                        <div className="bg-white rounded-3xl p-8 border border-hku-green/20 shadow-xl shadow-hku-green/5 animate-in zoom-in-95 duration-300">
                            <h3 className="text-xl font-serif font-bold text-hku-green mb-6">Configure Authenticator</h3>

                            <div className="space-y-8">
                                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm shrink-0">
                                        <QRCodeSVG value={setupData.provisioning_uri} size={180} />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-700">1. Scan QR Code</p>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                Open your authenticator app (Google Authenticator, Authy, etc.) and scan this code to link CRAS.
                                            </p>
                                        </div>
                                        <div className="space-y-1 pt-2">
                                            <p className="text-sm font-bold text-gray-700">2. Technical Secret</p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-[10px] bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-400 font-mono">
                                                    {setupData.secret}
                                                </code>
                                                <button
                                                    onClick={copySecret}
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors text-hku-green"
                                                >
                                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleVerifyAndEnable} className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-hku-green/70">Enter 6-digit Verification Code</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            required
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                            className="block w-full px-4 py-4 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-hku-green focus:bg-white transition-all outline-none text-center text-xl font-bold tracking-[0.5em] placeholder:text-gray-200"
                                            placeholder="000000"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading || verificationCode.length !== 6}
                                            className="flex-1 py-4 bg-hku-green text-white rounded-xl font-bold shadow-lg shadow-hku-green/20 hover:bg-hku-green/90 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify and Enable"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSetupData(null)}
                                            className="px-6 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-3xl p-12 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-white rounded-full shadow-sm text-gray-300">
                                <Shield className="w-12 h-12" />
                            </div>
                            <div className="max-w-[300px]">
                                <h4 className="font-serif font-bold text-gray-400">Step Priority Access</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Click "Enable MFA" to begin the secure setup process. You will need an authenticator app installed on your smartphone.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-bottom-2">
                    <AlertCircle className="h-5 w-5 text-hku-error shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}
        </div>
    );
};

export default MFASettings;

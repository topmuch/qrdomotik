'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Eye, EyeOff, ArrowRight, Loader2, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const tabSlideIn = {
  hidden: { opacity: 0, x: -15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: 15, transition: { duration: 0.15 } },
};

const tabSlideInReverse = {
  hidden: { opacity: 0, x: 15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: -15, transition: { duration: 0.15 } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

export function AuthDialog() {
  const { isOpen, defaultTab, closeAuth } = useAuthStore();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Reset forms when dialog opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setDirection('left');
      setShowPassword(false);
      setLoginEmail('');
      setLoginPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
    }
  }, [isOpen, defaultTab]);

  const handleTabSwitch = (newTab: 'login' | 'register') => {
    setDirection(newTab === 'login' ? 'left' : 'right');
    setTab(newTab);
    setShowPassword(false);
  };

  const { update: updateSession } = useSession();

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Email ou mot de passe incorrect');
        return;
      }
      toast.success('Connexion réussie !');
      closeAuth();
      // Force session update after a short delay to let cookie propagate
      setTimeout(() => { window.location.reload(); }, 300);
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [loginEmail, loginPassword, closeAuth]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword || !regConfirm) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim(), password: regPassword, fullName: regName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }
      toast.success('Compte créé ! Connexion en cours...');
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim(), password: regPassword }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        toast.info('Compte créé. Connectez-vous maintenant.');
        setTab('login');
        setLoginEmail(regEmail.trim());
        setLoginPassword('');
      } else {
        toast.success('Bienvenue sur QR Domotik !');
        closeAuth();
        setTimeout(() => { window.location.reload(); }, 300);
      }
    } catch {
      toast.error('Erreur serveur, veuillez réessayer');
    } finally {
      setLoading(false);
    }
  }, [regName, regEmail, regPassword, regConfirm, closeAuth]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeAuth(); }}>
      <DialogContent
        className="sm:max-w-[440px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl gap-0"
        showCloseButton={false}
      >
        {/* Decorative blobs (behind content) */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        {/* Gradient header bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 rounded-t-2xl" />

        {/* Close button */}
        <button
          onClick={closeAuth}
          className="absolute top-5 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100/80 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Fermer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        <div className="px-6 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10">
          {/* Logo + Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 shadow-lg shadow-blue-500/20 mb-3">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {tab === 'login' ? 'Bon retour !' : 'Créer un compte'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-1">
              {tab === 'login'
                ? 'Connectez-vous pour accéder à votre espace'
                : 'Rejoignez QR Domotik gratuitement'}
            </DialogDescription>
          </div>

          {/* Tab Switcher */}
          <div className="relative flex bg-gray-100 rounded-xl p-1 mb-6">
            <div
              className={`absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out ${
                tab === 'login' ? 'left-1 w-[calc(50%-4px)]' : 'left-1/2 w-[calc(50%-4px)]'
              }`}
            />
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'login' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'register' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Inscription
            </button>
          </div>

          {/* Form content with animated tab transition */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {tab === 'login' ? (
                <motion.form
                  key="login"
                  custom={direction}
                  variants={direction === 'right' ? tabSlideIn : tabSlideInReverse}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  {/* Email */}
                  <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="vous@exemple.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Se connecter
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.div>

                  {/* Switch to register */}
                  <p className="text-center text-sm text-gray-500">
                    Pas encore de compte ?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('register')}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Créer un compte gratuit
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  custom={direction}
                  variants={direction === 'right' ? tabSlideInReverse : tabSlideIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="reg-name"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Jean Dupont"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Email */}
                  <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="vous@exemple.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 caractères"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="reg-confirm"
                        type={showPassword ? 'text' : 'password'}
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        placeholder="Répétez le mot de passe"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Créer mon compte
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.div>

                  {/* Switch to login */}
                  <p className="text-center text-sm text-gray-500">
                    Déjà un compte ?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('login')}
                      className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      Se connecter
                    </button>
                  </p>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 pt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      Données sécurisées
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Gratuit pour toujours
                    </span>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

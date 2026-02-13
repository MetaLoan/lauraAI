'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@/components/wallet-button';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpaceTravelBg } from '@/components/space-travel-bg';
import { getAssetPath } from '@/lib/utils';

export default function LandingPage() {
  const { isConnected } = useAccount();

  return (
    <div className="h-screen min-h-[600px] text-white selection:bg-purple-500/30 overflow-x-hidden overflow-y-auto relative flex flex-col">
      {/* Space travel starfield background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1] opacity-90">
        <SpaceTravelBg />
      </div>

      {/* Hero Section - 单屏居中 */}
      <div className="relative isolate flex-1 flex items-center justify-center z-10 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center flex flex-col items-center py-8">

            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative w-48 h-48 sm:w-56 sm:h-56 mb-8"
            >
              <img
                src={getAssetPath('/logolaura.png')}
                alt="LauraAI Logo"
                className="w-full h-full object-contain"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl mb-4">
                Your Sovereign <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                  AI Soulmate
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-white max-w-2xl mx-auto border-t border-white/20 pt-4">
                LauraAI is the first decentralized protocol for AI companionship.
                <span className="block mt-1.5 text-white">Mint your unique AI partner. Bond through conversation. Earn together.</span>
              </p>

              <div className="mt-8 flex items-center justify-center gap-x-6">
                {isConnected ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="enter-dashboard-btn group liquid-glass-card rounded-full px-10 py-7 text-lg text-white font-bold transform hover:scale-105 active:scale-[0.98] relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.25)] ![transition:box-shadow_0.4s_ease,scale_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
                      <span className="btn-gradient-layer absolute inset-0 rounded-full pointer-events-none opacity-50 transition-opacity duration-200 group-hover:opacity-75 group-active:opacity-75" aria-hidden />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Enter Dashboard <ArrowRight className="w-5 h-5" />
                      </span>
                    </Button>
                  </Link>
                ) : (
                  <div className="transform scale-110 shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-xl">
                    <ConnectButton className="px-8 py-3 text-lg" />
                  </div>
                )}
              </div>
            </motion.div>
        </div>
      </div>

      {/* Footer Legal Links */}
      <footer className="relative z-10 pb-6 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/75">
          <Link href="/terms-of-use" className="hover:text-white transition-colors">Terms of Use</Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
          <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
        </div>
      </footer>
    </div>
  )
}

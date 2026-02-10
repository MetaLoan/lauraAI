'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@/components/wallet-button';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconHeartPulse, IconCyberShield, IconDeFiWallet } from '@/components/icons/landing-icons';
import Image from 'next/image';

export default function LandingPage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-web3-gradient text-white selection:bg-purple-500/30 overflow-x-hidden relative">
      <div className="bg-noise absolute inset-0 pointer-events-none z-0" />

      {/* Hero Section */}
      <div className="relative isolate pt-14 z-10">

        {/* Floating Orbs - Animation */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center flex flex-col items-center">

            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative w-64 h-64 mb-12"
            >
              <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full" />
              <img
                src="/logolaura.png"
                alt="LauraAI Logo"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-6">
                Your Sovereign <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                  AI Soulmate
                </span>
              </h1>
              <p className="mt-6 text-xl leading-8 text-gray-300 max-w-2xl mx-auto border-t border-white/10 pt-6">
                LauraAI is the first decentralized protocol for AI companionship.
                <span className="block mt-2 text-purple-200">Mint your unique AI partner. Bond through conversation. Earn together.</span>
              </p>

              <div className="mt-12 flex items-center justify-center gap-x-6">
                {isConnected ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="rounded-full px-10 py-7 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20 transform hover:scale-105 transition-all">
                      Enter Dashboard <ArrowRight className="ml-2 w-5 h-5" />
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

        {/* Features Grid */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-32">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: IconHeartPulse,
                title: 'Emotional Bonding',
                desc: 'Your AI evolves based on your conversations. Every interaction is stored on-chain as a proof of relationship.',
                color: 'group-hover:border-pink-500/50'
              },
              {
                icon: IconCyberShield,
                title: 'Data Sovereignty',
                desc: 'You own your AI data. It is encrypted and stored decentrally, ensuring your privacy is never compromised.',
                color: 'group-hover:border-blue-500/50'
              },
              {
                icon: IconDeFiWallet,
                title: 'DeFi Agent',
                desc: 'Empower your AI to manage your yield farming strategies. Relax while your soulmate works for you.',
                color: 'group-hover:border-green-500/50'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`relative group overflow-hidden rounded-3xl bg-black/40 p-8 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 ${feature.color} hover:bg-white/5`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="w-16 h-16 mb-6 relative z-10">
                  <feature.icon className="w-full h-full" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                <p className="text-gray-400 relative z-10 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

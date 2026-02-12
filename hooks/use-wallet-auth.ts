'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { apiClient } from '@/lib/api'

const STORAGE_KEY_ADDRESS = 'wallet_address'
const STORAGE_KEY_TOKEN = 'auth_token'

/**
 * Wallet authentication flow:
 * 1) request nonce challenge from backend
 * 2) sign challenge with wallet
 * 3) verify signature and receive Bearer token
 */
export function useWalletAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const signingRef = useRef(false)

  // Check if we already have a valid token for the current address
  const checkExistingAuth = useCallback(() => {
    if (typeof window === 'undefined') return false
    try {
      const storedAddr = sessionStorage.getItem(STORAGE_KEY_ADDRESS)
      const storedToken = sessionStorage.getItem(STORAGE_KEY_TOKEN)
      if (storedAddr && storedToken && address && storedAddr === address.toLowerCase()) {
        setIsAuthenticated(true)
        return true
      }
    } catch {
      // sessionStorage not available
    }
    return false
  }, [address])

  // Sign challenge + verify to get token
  const signAuth = useCallback(async () => {
    if (!address || signingRef.current) return
    signingRef.current = true
    setIsSigning(true)

    try {
      const normalizedAddress = address.toLowerCase()
      const challenge = await apiClient.authGetNonce(normalizedAddress) as {
        nonce: string
        message: string
      }
      const signature = await signMessageAsync({ message: challenge.message })
      const urlParams = new URLSearchParams(window.location.search)
      const inviterCode = urlParams.get('invite') || ''

      const verifyResult = await apiClient.authVerify({
        wallet_address: normalizedAddress,
        nonce: challenge.nonce,
        signature,
        inviter_code: inviterCode || undefined,
      }) as {
        access_token: string
      }

      sessionStorage.setItem(STORAGE_KEY_ADDRESS, normalizedAddress)
      sessionStorage.setItem(STORAGE_KEY_TOKEN, verifyResult.access_token)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Wallet auth signing failed:', error)
      clearAuth()
    } finally {
      setIsSigning(false)
      signingRef.current = false
    }
  }, [address, signMessageAsync])

  // Clear stored auth data
  const clearAuth = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.removeItem(STORAGE_KEY_ADDRESS)
      sessionStorage.removeItem(STORAGE_KEY_TOKEN)
    } catch {
      // sessionStorage not available
    }
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      const hasAuth = checkExistingAuth()
      if (!hasAuth) {
        signAuth()
      }
    } else {
      // Wallet disconnected — clear auth
      clearAuth()
    }
  }, [isConnected, address, checkExistingAuth, signAuth, clearAuth])

  return {
    isAuthenticated,
    isSigning,
    signAuth,
    clearAuth,
  }
}

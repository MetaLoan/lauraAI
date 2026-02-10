'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

const STORAGE_KEY_ADDRESS = 'wallet_address'
const STORAGE_KEY_SIGNATURE = 'wallet_signature'

/**
 * Hook that manages wallet-based authentication.
 * When a wallet connects, it prompts the user to sign a deterministic message.
 * The address + signature are stored in sessionStorage for the API client to read.
 */
export function useWalletAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const signingRef = useRef(false)

  // Build the deterministic message to sign
  const getAuthMessage = useCallback((addr: string) => {
    return `LauraAI Auth: ${addr.toLowerCase()}`
  }, [])

  // Check if we already have a valid signature for the current address
  const checkExistingAuth = useCallback(() => {
    if (typeof window === 'undefined') return false
    try {
      const storedAddr = sessionStorage.getItem(STORAGE_KEY_ADDRESS)
      const storedSig = sessionStorage.getItem(STORAGE_KEY_SIGNATURE)
      if (storedAddr && storedSig && address && storedAddr === address.toLowerCase()) {
        setIsAuthenticated(true)
        return true
      }
    } catch {
      // sessionStorage not available
    }
    return false
  }, [address])

  // Sign the auth message and store it
  const signAuth = useCallback(async () => {
    if (!address || signingRef.current) return
    signingRef.current = true
    setIsSigning(true)

    try {
      const message = getAuthMessage(address)
      const signature = await signMessageAsync({ message })

      // Store in sessionStorage
      sessionStorage.setItem(STORAGE_KEY_ADDRESS, address.toLowerCase())
      sessionStorage.setItem(STORAGE_KEY_SIGNATURE, signature)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Wallet auth signing failed:', error)
      // User rejected or error — clear any stale auth
      clearAuth()
    } finally {
      setIsSigning(false)
      signingRef.current = false
    }
  }, [address, getAuthMessage, signMessageAsync])

  // Clear stored auth data
  const clearAuth = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.removeItem(STORAGE_KEY_ADDRESS)
      sessionStorage.removeItem(STORAGE_KEY_SIGNATURE)
    } catch {
      // sessionStorage not available
    }
    setIsAuthenticated(false)
  }, [])

  // When wallet connects, check existing auth or prompt for signature
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
    signAuth,   // Expose for manual re-sign if needed
    clearAuth,
  }
}

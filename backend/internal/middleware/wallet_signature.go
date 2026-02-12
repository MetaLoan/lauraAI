package middleware

import (
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

func NormalizeWalletAddress(address string) (string, error) {
	addr := strings.TrimSpace(address)
	if !common.IsHexAddress(addr) {
		return "", fmt.Errorf("invalid wallet address")
	}
	return strings.ToLower(addr), nil
}

// VerifyWalletSignatureMessage verifies an EIP-191 personal_sign signature for a given message.
func VerifyWalletSignatureMessage(address string, sigHex string, message string) error {
	sigHex = strings.TrimPrefix(sigHex, "0x")
	sigBytes, err := hex.DecodeString(sigHex)
	if err != nil {
		return fmt.Errorf("invalid signature hex: %v", err)
	}

	if len(sigBytes) != 65 {
		return fmt.Errorf("invalid signature length: expected 65, got %d", len(sigBytes))
	}

	if sigBytes[64] >= 27 {
		sigBytes[64] -= 27
	}

	prefixedMsg := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	hash := crypto.Keccak256Hash([]byte(prefixedMsg))

	pubKey, err := crypto.Ecrecover(hash.Bytes(), sigBytes)
	if err != nil {
		return fmt.Errorf("ecrecover failed: %v", err)
	}

	recoveredPubKey, err := crypto.UnmarshalPubkey(pubKey)
	if err != nil {
		return fmt.Errorf("unmarshal pubkey failed: %v", err)
	}
	recoveredAddr := crypto.PubkeyToAddress(*recoveredPubKey)

	if strings.ToLower(recoveredAddr.Hex()) != strings.ToLower(address) {
		return fmt.Errorf("signature address mismatch")
	}

	return nil
}

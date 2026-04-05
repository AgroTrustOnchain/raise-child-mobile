import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

type WalletData = {
    address: string,
    sub: string,
    ephemeralKeyPair: Ed25519Keypair
}

type WalletContextType = {
    wallet: WalletData | null;
    setWallet: React.Dispatch<React.SetStateAction<WalletData | null>>;
};
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletCustomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    return (
        <WalletContext.Provider value={{ wallet, setWallet }}>
            {children}
        </WalletContext.Provider>
    );
};

// Custom hook to easily consume the context
export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
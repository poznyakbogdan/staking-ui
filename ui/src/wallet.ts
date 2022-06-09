import { web3 } from '@project-serum/anchor';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { State } from './state';

export let provider: CustomWalletAdapter = null; 

export interface CustomWalletAdapter extends PhantomWalletAdapter {
    signAndSendTransaction(transaction: web3.Transaction): Promise<web3.Transaction>
}

function getPhantomProvider(): CustomWalletAdapter {
    if ("solana" in window) {
        const provider = (window as any).solana;
        if (provider?.isPhantom) {
            return provider;
        }
    }
    window.open("https://phantom.app/", "_blank");
};

export async function connectWallet() {
    provider = getPhantomProvider();
    await provider.connect();
    State.wallet = provider;
}

export function getWalletPubkey() {
    return provider.publicKey;
}
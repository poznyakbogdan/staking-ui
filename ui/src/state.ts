import { web3 } from "@project-serum/anchor";
import { Account } from "@solana/spl-token";
import { CustomWalletAdapter } from "./wallet";

interface AppState {
    userWmpAccount: Account,
    userXWmpAccount: Account,
    wmpStakingData: WmpStakingData,
    stakingMetadata: GlobalState,
    userState: UserState,
    wallet: CustomWalletAdapter
}

interface WmpStakingData {
    isInitialized: boolean,
    wmpMintAddress: web3.PublicKey,
    xWmpMintAddress: web3.PublicKey,
    metadata: web3.PublicKey,
    wmpEscrowAddress: web3.PublicKey,
    xWmpEscrowAddress: web3.PublicKey,
}

export class UserState {
    public balance: number;
    public rewardPerTokenPaid: number;
    public rewards: number;

    constructor(obj) {
        this.balance = obj.balance.toNumber();
        this.rewardPerTokenPaid = obj.rewardPerTokenPaid.toNumber();
        this.rewards = obj.rewards.toNumber();
    }
}

export class GlobalState {
    public admin: string;
    public lastUpdateTimestamp: Date;
    public rewardPerTokenStored: number;
    public rewardRate: number;
    public rewardTokenMint: string;
    public stakingTokenMint: string;
    public totalSupply: number;

    constructor(obj) {
        this.admin = obj.admin.toBase58();
        this.lastUpdateTimestamp = new Date(obj.lastUpdateTimestamp.toNumber() * 1000);
        this.rewardPerTokenStored = obj.rewardPerTokenStored.toNumber();
        this.rewardRate = obj.rewardRate.toNumber();
        this.rewardTokenMint = obj.rewardTokenMint.toBase58();
        this.stakingTokenMint = obj.stakingTokenMint.toBase58();
        this.totalSupply = obj.totalSupply.toNumber();
    }
}

export let State: AppState = {} as AppState;
import { createAccount, mintTo, createMint as createMintInternal, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress, createMintToInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";
import * as config from "./uiConfig";
import { BN } from "bn.js";

type PublicKey = web3.PublicKey;
type Signer = web3.Signer;

export interface ICreateMint {
    publicKey: PublicKey;
}

export async function createTokenAccount(tokenMint: PublicKey, account: PublicKey) : Promise<PublicKey> {
    let connection = config.getConnection();
    let payer = await config.getPayer();
    let tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, account, true);

    console.log("AssociatedTokenAccount created: " + tokenAccount.address.toBase58());
    return tokenAccount.address;
}

export async function getAssociatedTokenAccount(tokenMint: PublicKey, account: PublicKey) : Promise<PublicKey> {
    return await getAssociatedTokenAddress(tokenMint, account, true);
}

export async function mintTokensTo(tokenMint: PublicKey, toAccount: PublicKey, amount: number) {
    let authority = await config.getMintAuthKeyPair();
    let connection = config.getConnection();
    let payer = await config.getPayer();
    await mintTo(connection, payer, tokenMint, toAccount, authority, amount);
}

export function createMintTokensToTx(tokenMint: PublicKey, toAccount: PublicKey, authority: PublicKey, amount: number) {
    let ix = createMintToInstruction(tokenMint, toAccount, authority, amount);
    return new web3.Transaction().add(ix);
}

export async function createCreateTokenAccountTx(tokenMint: PublicKey, account: PublicKey, payer: PublicKey) {
    let associatedTokenAddress = await getAssociatedTokenAccount(tokenMint, account);
    let ix = createAssociatedTokenAccountInstruction(payer, associatedTokenAddress, account, tokenMint);
    return new web3.Transaction().add(ix);
}

export async function createMint(decimals: number = 0) : Promise<ICreateMint> {
    let connection = config.getConnection();
    let payer: Signer = await config.getPayer();
    let mintAuth: PublicKey = await config.getMintAuth();
    let freezeAuth: PublicKey = await config.getFreezeAuth();

    let createMintResult = await createMintInternal(connection, payer, mintAuth, freezeAuth, decimals);
    return {
        publicKey: createMintResult
    } as ICreateMint;
}
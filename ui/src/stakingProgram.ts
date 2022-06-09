import { AnchorProvider, Idl, Program, web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "bn.js";
import { getAssociatedTokenAccount } from "../../app/setup/createMint";
import { findEscrowRewardsTokenPda, findEscrowStakingTokenPda, findMetadataPda, findUserStatePda } from "../../app/setup/pda";
import { getConnection } from "../../app/setup/uiConfig";
import * as idl from "./idl.json";
import * as wallet from "./wallet";

let program: Program = null;

export function initProgram() {
    let provider = new AnchorProvider(getConnection(), wallet.provider, {});
    let programId = new web3.PublicKey("EA6rPzuLa1riBUEwo2C4jRaHeZBkSEuAJCrqwEyWNMn5");

    program = new Program(idl as Idl, programId, provider);
}

export async function getMetadataAccount(metadataAddress: web3.PublicKey){
    let data = await program.account.globalState.fetchNullable(metadataAddress);
    return data;
}

export async function getUserState(userAddress: web3.PublicKey, metadata: web3.PublicKey){
    let userStatePda = await findUserStatePda(userAddress, metadata);
    let data = await program.account.userState.fetchNullable(userStatePda[0]);
    return data
}

export async function createInitializeStakingTx(wmpMintAddress: web3.PublicKey, xWmpMintAddress: web3.PublicKey, rewardRate: number) {
    let stakeTokenMint = wmpMintAddress;
    let rewardsTokenMint = xWmpMintAddress;

    let admin = wallet.provider.publicKey;

    let metadata = await findMetadataPda(stakeTokenMint, rewardsTokenMint);
    console.log("metadata: " + metadata[0].toBase58());

    let escrowStakingTokenPda = await findEscrowStakingTokenPda(stakeTokenMint);
    console.log("escrowStakingToken: " + escrowStakingTokenPda[0].toBase58());

    let escrowRewardsTokenPda = await findEscrowRewardsTokenPda(rewardsTokenMint);
    console.log("escrowRewardsToken: " + escrowRewardsTokenPda[0].toBase58());

    let tx = await program.methods
        .initialize(new BN(rewardRate))
        .accounts({
            admin: admin,
            metadata: metadata[0],
            stakingTokenMint: stakeTokenMint,
            rewardsTokenMint: rewardsTokenMint,
            escrowStakingToken: escrowStakingTokenPda[0],
            escrowRewardsToken: escrowRewardsTokenPda[0],
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY
        })
        .signers([])
        .transaction();

    return tx;
}

export async function createStakeTx(
    wmpMintAddress: web3.PublicKey, 
    metadata: web3.PublicKey, 
    amount: number) {
    let stakeTokenMint = wmpMintAddress;
    let user = wallet.provider.publicKey;
    let userStakingToken = await getAssociatedTokenAccount(wmpMintAddress, user);
    let escrowStakingToken = await findEscrowStakingTokenPda(stakeTokenMint);
    let userState = await findUserStatePda(user, metadata);

    let tx = await program.methods
        .stake(new BN(amount))
        .accounts({
            user: user,
            userStakingToken: userStakingToken,
            escrowStakingToken: escrowStakingToken[0],
            userState: userState[0],
            metadata: metadata,
            stakingTokenMint: stakeTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
        })
        .signers([])
        .transaction();

    return tx;
}

export async function createUnstakeTx(
    wmpMintAddress: web3.PublicKey, 
    xWmpMintAddress: web3.PublicKey, 
    metadata: web3.PublicKey, 
    amount: number) {
    let stakeTokenMint = wmpMintAddress;
    let rewardsTokenMint = xWmpMintAddress;
    let user = wallet.provider.publicKey;
    let userStakingToken = await getAssociatedTokenAccount(wmpMintAddress, user);
    let escrowStakingToken = await findEscrowStakingTokenPda(stakeTokenMint);
    let userState = await findUserStatePda(user, metadata);
    let [_, metadataBumpSeed] = await findMetadataPda(stakeTokenMint, rewardsTokenMint);

    let tx = await program.methods
        .unstake(new BN(amount), new BN(metadataBumpSeed))
        .accounts({
            user: user,
            userStakingToken: userStakingToken,
            userState: userState[0],
            metadata: metadata,
            escrowStakingToken: escrowStakingToken[0],
            stakingTokenMint: stakeTokenMint,
            rewardsTokenMint: xWmpMintAddress,
            tokenProgram: TOKEN_PROGRAM_ID
        })
        .signers([])
        .transaction();

    return tx;
}

export async function createGetRewardsTx(
    wmpMintAddress: web3.PublicKey, 
    xWmpMintAddress: web3.PublicKey, 
    metadata: web3.PublicKey) {
    let stakeTokenMint = wmpMintAddress;
    let rewardsTokenMint = xWmpMintAddress;
    let user = wallet.provider.publicKey;
    let userRewardsToken = await getAssociatedTokenAccount(rewardsTokenMint, user);
    let userState = await findUserStatePda(user, metadata);
    let escrowRewardsToken = await findEscrowRewardsTokenPda(rewardsTokenMint);
    let [_, metadataBumpSeed] = await findMetadataPda(stakeTokenMint, rewardsTokenMint);

    let tx = await program.methods
        .getRewards(new BN(metadataBumpSeed))
        .accounts({
            user: user,
            userRewardsToken: userRewardsToken,
            userState: userState[0],
            metadata: metadata,
            escrowRewardsToken: escrowRewardsToken[0],
            stakingTokenMint: stakeTokenMint,
            rewardsTokenMint: rewardsTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID
        })
        .signers([])
        .transaction();

    return tx;
}
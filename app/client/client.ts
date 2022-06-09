import { web3, Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { BN } from "bn.js";
import fs from "fs";
import { getDefaultPayer, getStakingAuth, getStakingAuthKeyPair } from "../setup/config";
import { createMint, createTokenAccount, getAssociatedTokenAccount, mintTokensTo } from "../setup/createMint";
import { findEscrowRewardsTokenPda, findEscrowStakingTokenPda, findMetadataPda, findUserStatePda } from "../setup/pda";

const idl = JSON.parse(
    fs.readFileSync("./target/idl/wmp_staking.json", "utf8")
);
const programId = new web3.PublicKey("EA6rPzuLa1riBUEwo2C4jRaHeZBkSEuAJCrqwEyWNMn5");
const program = new Program(idl, programId);

export async function initialze() {
    let stakeTokenMint = await createMint();
    let rewardsTokenMint = await createMint();

    let admin = await getStakingAuthKeyPair();
    let metadata = await findMetadataPda(stakeTokenMint.publicKey, rewardsTokenMint.publicKey);
    console.log("metadata: " + metadata[0].toBase58());

    let escrowStakingTokenPda = await findEscrowStakingTokenPda(stakeTokenMint.publicKey);
    console.log("escrowStakingToken: " + escrowStakingTokenPda[0].toBase58());

    let escrowRewardsTokenPda = await findEscrowRewardsTokenPda(rewardsTokenMint.publicKey);
    console.log("escrowRewardsToken: " + escrowRewardsTokenPda[0].toBase58());

    let feePayer = await getDefaultPayer();

    console.log("Fee payer: " + feePayer.publicKey.toBase58());
    await program.methods
        .initialize()
        .accounts({
            admin: admin.publicKey,
            metadata: metadata[0],
            stakingTokenMint: stakeTokenMint.publicKey,
            rewardsTokenMint: rewardsTokenMint.publicKey,
            escrowStakingToken: escrowStakingTokenPda[0],
            escrowRewardsToken: escrowRewardsTokenPda[0],
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY
        })
        .signers([admin])
        .rpc();

    await mintTokensTo(rewardsTokenMint.publicKey, escrowRewardsTokenPda[0], 2222);
    console.log("Minted 2222 tokens to escrow rewards account");
    
    console.log("Metadata: " + metadata[0].toBase58());
    console.log("Metadata bump: " + metadata[1]);
    console.log("Escrow staking token: " + escrowStakingTokenPda[0]);
    console.log("Escrow rewards token: " + escrowRewardsTokenPda[0]);

    return metadata[0];
}


export async function stake(metadataAddress: web3.PublicKey, user: web3.Signer, amount: number) {
    let [stakeTokenMint, _] = await getMints(metadataAddress);

    let userStakingToken = await createTokenAccount(stakeTokenMint, user.publicKey);
    await mintTokensTo(stakeTokenMint, userStakingToken, 20);

    let escrowStakingToken = await findEscrowStakingTokenPda(stakeTokenMint);
    let userState = await findUserStatePda(user.publicKey, metadataAddress);

    let feePayer = await getDefaultPayer();
    console.log("Fee payer: " + feePayer.publicKey.toBase58());

    let txHash = await program.methods
        .stake(new BN(amount))
        .accounts({
            user: user.publicKey,
            userStakingToken: userStakingToken,
            escrowStakingToken: escrowStakingToken[0],
            userState: userState[0],
            metadata: metadataAddress,
            stakingTokenMint: stakeTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

    console.log("Hash: " + txHash);

    let data = await program.account.globalState.fetch(metadataAddress);

    console.table(data);
}

export async function unstake(metadataAddress: web3.PublicKey, user: web3.Signer, amount: number) {
    let [stakeTokenMint, rewardsTokenMint] = await getMints(metadataAddress);

    let userStakingToken = await getAssociatedTokenAccount(stakeTokenMint, user.publicKey);

    let escrowStakingToken = await findEscrowStakingTokenPda(stakeTokenMint);
    let userState = await findUserStatePda(user.publicKey, metadataAddress);

    let feePayer = await getDefaultPayer();
    console.log("Fee payer: " + feePayer.publicKey.toBase58());

    let metadata = await findMetadataPda(stakeTokenMint, rewardsTokenMint);
    console.log("Metadata : " + metadata[0].toBase58());
    console.log("Metadata bump: " + metadata[1]);

    let txHash = await program.methods
        .unstake(new BN(amount), new BN(metadata[1]))
        .accounts({
            user: user.publicKey,
            userStakingToken: userStakingToken,
            userState: userState[0],
            metadata: metadataAddress,
            escrowStakingToken: escrowStakingToken[0],
            stakingTokenMint: stakeTokenMint,
            rewardsTokenMint: rewardsTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID
        })
        .signers([user])
        .rpc();

    console.log("Hash: " + txHash);

    let data = await program.account.globalState.fetch(metadataAddress);

    console.table(data);
}

export async function getRewards(metadataAddress: web3.PublicKey, user: web3.Signer) {
    let [stakeTokenMint, rewardsTokenMint] = await getMints(metadataAddress);

    let userRewardsToken = await createTokenAccount(rewardsTokenMint, user.publicKey);

    let escrowRewardsToken = await findEscrowRewardsTokenPda(rewardsTokenMint);
    let userState = await findUserStatePda(user.publicKey, metadataAddress);

    let feePayer = await getDefaultPayer();
    console.log("Fee payer: " + feePayer.publicKey.toBase58());

    let metadata = await findMetadataPda(stakeTokenMint, rewardsTokenMint);
    console.log("Metadata : " + metadata[0].toBase58());
    console.log("Metadata bump: " + metadata[1]);

    let txHash = await program.methods
        .getRewards(new BN(metadata[1]))
        .accounts({
            user: user.publicKey,
            userRewardsToken: userRewardsToken,
            userState: userState[0],
            metadata: metadataAddress,
            escrowRewardsToken: escrowRewardsToken[0],
            stakingTokenMint: stakeTokenMint,
            rewardsTokenMint: rewardsTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID
        })
        .signers([user])
        .rpc();

    console.log("Hash: " + txHash);

    let data = await program.account.globalState.fetch(metadataAddress);

    console.table(data);

    return txHash;
}

async function getMints(metadataAddress: web3.PublicKey): Promise<[web3.PublicKey, web3.PublicKey]> {
    let data = await program.account.globalState.fetch(metadataAddress);

    return [data.stakingTokenMint, data.rewardTokenMint];
}
import { connectWallet, getWalletPubkey, provider } from "./wallet";
import { createCreateTokenAccountTx, createMintTokensToTx } from "../../app/setup/createMint";
import { getConnection, getWmpMintAddress, getXWmpMintAddress } from "../../app/setup/uiConfig";
import { web3 } from "@project-serum/anchor";
import { ConnectWalletButtonId, CreateWmpAccountBtnId, CreateXWmpAccountBtnId, GetRewardsBtnId, InitStakingBtnId, MintWmpBtnId, MintXWmpBtnId, StakeBtnId, UnstakeBtnId } from "./constants";
import { getAccount, getAssociatedTokenAddress, TokenAccountNotFoundError } from "@solana/spl-token";
import { GlobalState, State, UserState } from "./state";
import { Connection } from "@solana/web3.js";
import { findEscrowRewardsTokenPda, findEscrowStakingTokenPda, findMetadataPda } from "../../app/setup/pda";
import { createGetRewardsTx, createInitializeStakingTx, createStakeTx, createUnstakeTx, getMetadataAccount, getUserState, initProgram } from "./stakingProgram";
import { render } from "./render";
import { accountExist } from "./splToken";

export function registerHandlers() {
    document.getElementById(ConnectWalletButtonId).addEventListener("click", () => {
        connectWallet()
            .then(loadState)
            .then(render)
    });

    document.getElementById(MintWmpBtnId).addEventListener("click", mintWmpBtnClickHandler);
    document.getElementById(MintXWmpBtnId).addEventListener("click", mintXWmpBtnClickHandler);
    document.getElementById(CreateWmpAccountBtnId).addEventListener("click", createWmpAccountBtnClickHandler);
    document.getElementById(CreateXWmpAccountBtnId).addEventListener("click", createXWmpAccountBtnClickHandler);
    document.getElementById(InitStakingBtnId).addEventListener("click", initStakingBtnClickHandler);
    document.getElementById(StakeBtnId).addEventListener("click", stakeBtnClickHandler);
    document.getElementById(UnstakeBtnId).addEventListener("click", unstakeBtnClickHandler);
    document.getElementById(GetRewardsBtnId).addEventListener("click", getRewardsBtnClickHandler);
}

async function loadState() {
    let connection = getConnection();

    initProgram();
    
    await loadWmpStakingData(connection);
    await loadWmpAccount(connection);
    await loadXWmpAccount(connection);
    await loadUserStakingState();
}

async function loadWmpAccount(connection: Connection) {
    let wmpMint = getWmpMintAddress();
    let owner = provider.publicKey;

    let userWmpAddress = await getAssociatedTokenAddress(wmpMint, owner, true);
    try {
        let userWmpAccount = await getAccount(connection, userWmpAddress);
        State.userWmpAccount = userWmpAccount;
    } catch (err: unknown) {
        console.error(err);
        State.userWmpAccount = null;
    }
}

async function loadXWmpAccount(connection: Connection) {
    let xWmpMint = getXWmpMintAddress();
    let owner = provider.publicKey;

    let userXWmpAddress = await getAssociatedTokenAddress(xWmpMint, owner, true);
    
    try {
        let userXWmpAccount = await getAccount(connection, userXWmpAddress);
        State.userXWmpAccount = userXWmpAccount;
    } catch (err: unknown) {
        console.error(err);
        State.userXWmpAccount = null;
    }
}

async function loadWmpStakingData(connection: Connection) {
    let wmpMintAddress = getWmpMintAddress();
    let xWmpMintAddress = getXWmpMintAddress();

    let metadata = await findMetadataPda(wmpMintAddress, xWmpMintAddress);
    let data = await getMetadataAccount(metadata[0]);
    
    if (data == null) return;

    State.stakingMetadata = new GlobalState(data);
    State.wmpStakingData = {
        isInitialized: true,
        wmpEscrowAddress: (await findEscrowStakingTokenPda(wmpMintAddress))[0],
        xWmpEscrowAddress: (await findEscrowRewardsTokenPda(xWmpMintAddress))[0],
        metadata: metadata[0],
        wmpMintAddress,
        xWmpMintAddress
    };

    console.log(State);
}

async function createWmpAccountBtnClickHandler() {
    let wmpMint = getWmpMintAddress();
    let authority = getWalletPubkey();

    let tx = await createCreateTokenAccountTx(wmpMint, authority, authority);
    await sendTransaction(tx);
}

async function createXWmpAccountBtnClickHandler() {
    let xWmpMint = getXWmpMintAddress();
    let authority = getWalletPubkey();

    let tx = await createCreateTokenAccountTx(xWmpMint, authority, authority);
    await sendTransaction(tx);
}

async function mintWmpBtnClickHandler() {
    let mintToAddress = (document.querySelector("#mint-wmp input[name='address']") as HTMLInputElement | null)?.value;
    if (mintToAddress == null) {
        console.error("mintToAddress cannot be empty");
        return;
    }

    let amount = (document.querySelector("#mint-wmp input[name='amount']") as HTMLInputElement | null)?.value;
    let wmpMint = getWmpMintAddress();
    let authority = getWalletPubkey();

    let tx = createMintTokensToTx(wmpMint, new web3.PublicKey(mintToAddress), authority, Number.parseInt(amount));

    await sendTransaction(tx);
}

async function mintXWmpBtnClickHandler() {
    let mintToAddress = (document.querySelector("#mint-xwmp input[name='address']") as HTMLInputElement | null)?.value;
    if (mintToAddress == null) {
        console.error("mintToAddress cannot be empty");
        return;
    }

    let amount = (document.querySelector("#mint-xwmp input[name='amount']") as HTMLInputElement | null)?.value;
    let xWmpMint = getXWmpMintAddress();
    let authority = getWalletPubkey();

    let tx = createMintTokensToTx(xWmpMint, new web3.PublicKey(mintToAddress), authority, Number.parseInt(amount));

    await sendTransaction(tx);
}

async function initStakingBtnClickHandler() {
    let rewardRate = (document.querySelector("#initialize-staking input[name='reward-rate']") as HTMLInputElement | null)?.value;
    let wmpMint = getWmpMintAddress();
    let xWmpMint = getXWmpMintAddress();
    let tx = await createInitializeStakingTx(wmpMint, xWmpMint, parseInt(rewardRate));
    await sendTransaction(tx);
}

async function sendTransaction(transaction: web3.Transaction) {
    let connection = getConnection();
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = provider.publicKey;

    const res = await provider.signAndSendTransaction(transaction);
    console.log(res);
}

async function stakeBtnClickHandler() {
    let amount = (document.querySelector("#stake input[name='amount']") as HTMLInputElement | null)?.value;
    let tx = await createStakeTx(State.wmpStakingData.wmpMintAddress, State.wmpStakingData.metadata, parseInt(amount));
    await sendTransaction(tx);
    await loadState();
    render();
}

async function getRewardsBtnClickHandler() {
    let tx = await createGetRewardsTx(State.wmpStakingData.wmpMintAddress, State.wmpStakingData.xWmpMintAddress, State.wmpStakingData.metadata);
    await sendTransaction(tx);
    await loadState();
    render();
}

async function unstakeBtnClickHandler() {
    let amount = (document.querySelector("#unstake input[name='amount']") as HTMLInputElement | null)?.value;
    let tx = await createUnstakeTx(State.wmpStakingData.wmpMintAddress, State.wmpStakingData.xWmpMintAddress, State.wmpStakingData.metadata, parseInt(amount));
    await sendTransaction(tx);
    await loadState();
    render();
}

async function loadUserStakingState() {
    if (State.wmpStakingData?.metadata == null) return;

    let data = await getUserState(State.wallet.publicKey, State.wmpStakingData.metadata);
    State.userState = data != null ? new UserState(data) : {} as UserState;
}

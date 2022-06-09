import { web3 } from "@project-serum/anchor";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { getConnection } from "../../app/setup/uiConfig";


export async function accountExist(connection: web3.Connection, mint: web3.PublicKey, userAddress: web3.PublicKey) {
    let tokenAddress = await getAssociatedTokenAddress(mint, userAddress, true);
    let account = await getAccount(connection, tokenAddress);
    return false;
}
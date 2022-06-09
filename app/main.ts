import { web3 } from "@project-serum/anchor";
import { getRewards, initialze, stake, unstake } from "./client/client";
import { getAliceKeyPair, getBobKeyPair } from "./setup/config";

let metadataAddress: web3.PublicKey;

async function unstakeWithAlice(metadataAddress, amount) {
    let alice = await getAliceKeyPair();
    await unstake(metadataAddress, alice, amount);

    console.log("Unstaked: " + amount);
}

async function stakeWithAlice(metadataAddress, amount) {
    let alice = await getAliceKeyPair();
    await stake(metadataAddress, alice, amount);

    console.log("Staked: " + amount);
}

async function getRewardsWithAlice(metadataAddress) {
    let alice = await getAliceKeyPair();
    let txHash = await getRewards(metadataAddress, alice);

    console.log("Claimed rewards: " + txHash);
}

async function stakeWithBob(metadataAddress, amount) {
    let bob = await getBobKeyPair();
    await stake(metadataAddress, bob, amount);

    console.log("Staked: " + amount);
}

function wait(delay) {
    return new Promise(function(resolve) {
        setTimeout(resolve, delay);
    });
}

initialze()
    .then(metadata => metadataAddress = metadata)
    .then(() => stakeWithAlice(metadataAddress, 12))
    .then(() => stakeWithBob(metadataAddress, 12))
    // .then(() => unstakeWithAlice(metadataAddress, 10))
    .then(() => wait(10000))
    .then(() => getRewardsWithAlice(metadataAddress))
    .catch(e => console.error(e));
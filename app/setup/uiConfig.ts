import { web3 } from "@project-serum/anchor";
import { Connection, PublicKey, Signer } from "@solana/web3.js";
import { createKeyPair } from "./utils";

let config = {
    "accounts": {
        "mintAuth": {
            "pk": "9gXyVADNKxpoMqZA4yYrVinvhm37z9da9YZcLUk9cWQU",
            "seed": "grace hole trust creek brick cheese shoe pen act else lucky shallow",
            "sk": [34,242,15,44,115,108,183,189,157,124,227,165,57,97,57,84,212,71,153,19,208,181,50,201,229,9,217,131,64,19,254,192,128,254,43,84,15,210,77,242,0,92,94,26,67,57,208,95,131,61,203,246,246,183,54,50,147,196,234,133,40,79,63,125]
        },
        "freezeAuth": {
            "pk": "8k3YbnKASQJCJwL4A2fFN5u8ZmnaDcRWETzAkiksv5Wq",
            "seed": "sketch ride spray panel mirror dune change time ride fork taxi siege",
            "sk": [69,192,33,254,26,89,168,199,98,113,254,71,86,0,120,197,113,167,118,49,107,151,130,253,43,227,129,108,101,74,93,3,115,8,169,36,143,129,220,133,49,73,226,53,233,126,243,202,36,76,223,105,29,77,26,79,102,216,8,152,251,204,171,90]
        },
        "alice": {
            "pk": "CJLXXF2MDUTUqAFiJptAgNAPtYXQ8m7o7JB3tRtk8itg",
            "seed": "fox reform dolphin typical twenty note slot bitter sunset skull elevator useless",
            "sk": [122,166,199,180,148,165,102,233,181,74,185,210,226,109,91,106,13,100,66,252,120,147,235,242,114,120,82,185,10,45,185,96,167,225,130,33,136,78,139,159,64,35,145,191,72,32,131,26,23,138,192,16,184,168,164,174,170,18,210,84,83,230,69,161]
        },
        "bob": {
            "pk": "DMGnoiD8tiTQxpfRfYtCZKywqe5Lqa2VJSYzMyu2jWtG",
            "seed": "author coffee oil museum fence spider release add sing ecology various muscle",
            "sk": [193,189,81,152,36,35,207,215,120,30,116,126,206,255,115,229,128,48,9,209,162,94,218,208,25,206,31,120,116,123,17,133,183,125,182,123,130,159,26,8,46,50,94,112,59,107,247,154,151,111,99,236,98,226,64,120,19,124,15,69,163,45,191,209]
        },
        "stakingAuth": {
            "pk": "CKhQPUqBTZhLnuFm1ciz3ma5faVJtkdR3vrFKRVMBy2",
            "seed": "vacant occur tired snap edge sock dream nasty siren over rifle close",
            "sk": [85,128,19,27,224,167,21,10,253,1,107,151,207,252,184,25,3,97,190,81,28,4,26,161,92,48,91,175,49,13,13,225,2,230,135,123,12,43,194,149,92,248,122,56,230,57,160,9,243,168,35,170,232,29,188,113,127,165,55,202,101,240,142,121]
        }
    },
    "programId": "EA6rPzuLa1riBUEwo2C4jRaHeZBkSEuAJCrqwEyWNMn5",
    "wmpMint": "3R5PdbQQgVtJ5EXpkQv6WdJK8bt7uP9yKrQH1iKo3RR6",
    "xWmpMint": "4VhLAmAXgH6gCf2kQdbA1GwXBipHyHibAnD6xPegmWMY"
};


const connection = new Connection(
    web3.clusterApiUrl('devnet'),
    'confirmed',
  );

export function getConfig() : object {
    return config;
}

export async function getAliceKeyPair() : Promise<Signer> {
    let keyPair = createKeyPair(config.accounts.alice.sk);
    return keyPair;
}

export async function getBobKeyPair() : Promise<Signer> {
    let keyPair = createKeyPair(config.accounts.bob.sk);
    return keyPair;
}

export function getAlicePublicKey() : PublicKey {
    let pkString = config.accounts.alice.pk;
    return new PublicKey(pkString);
}

export function getBobPublicKey() : PublicKey {
    let pkString = config.accounts.bob.pk;
    return new PublicKey(pkString);
}

export async function getMintAuth() : Promise<PublicKey> {
    let keyPair = createKeyPair(config.accounts.mintAuth.sk);
    return keyPair.publicKey;
}

export async function getStakingAuth() : Promise<PublicKey> {
    let keyPair = createKeyPair(config.accounts.stakingAuth.sk);
    return keyPair.publicKey;
}

export async function getMintAuthKeyPair() : Promise<Signer> {
    let keyPair = createKeyPair(config.accounts.mintAuth.sk);
    return keyPair;
}

export async function getStakingAuthKeyPair() : Promise<Signer> {
    let keyPair = createKeyPair(config.accounts.stakingAuth.sk);
    return keyPair;
}

export async function getFreezeAuth() : Promise<PublicKey> {
    let keyPair = createKeyPair(config.accounts.freezeAuth.sk);
    return keyPair.publicKey;
}

export function getConnection() : Connection {
    return connection;
}

export async function getDefaultPayer() : Promise<Signer> {
    let sk = [31,128,110,227,153,83,251,87,154,100,79,0,120,164,16,239,46,216,94,114,85,73,209,154,158,20,94,139,99,195,147,69,53,163,116,228,65,100,18,23,131,89,216,89,32,27,240,176,221,40,5,11,68,5,70,178,78,197,188,186,109,175,124,57];
    let keyPair = createKeyPair(sk);
    return keyPair;
}

export async function getPayer() : Promise<Signer> {
    return await getDefaultPayer();
}

export function getStakingProgramId() : PublicKey  {
    return new PublicKey(config.programId);
}

export function getWmpMintAddress() {
    return new PublicKey(config.wmpMint);
}

export function getXWmpMintAddress() {
    return new PublicKey(config.xWmpMint);
}
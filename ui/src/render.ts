import { getWmpMintAddress, getXWmpMintAddress } from "../../app/setup/uiConfig";
import { ConnectWalletBlockId, CreateWmpAccountBlockId, CreateXWmpAccountBlockId, EscrowRewardsTokenId, EscrowStakingTokenId, LastUpdatedTimeId, MetadataAddressId, MintWmpAddressId, MintXWmpAddressId, RewardRateId, RewardsPerTokenStoredId, RewardsTokenId, StakingTokenId, TotalSupplyId, UserRewardPerTokenPaid, UserRewardsBalance, UserStakedBalance, UserWmpAddress, UserWmpBalance, UserXWmpAddress, UserXWmpBalance, WalletConnectedBlockId, WmpAddressExistsBlockId, XWmpAddressExistsBlockId } from "./constants";
import { State } from "./state";

export function render() {
    document.getElementById(ConnectWalletBlockId).style.display = "none";
    document.getElementById(WalletConnectedBlockId).style.display = "block";

    document.getElementById(MintWmpAddressId).textContent = getWmpMintAddress().toBase58();
    document.getElementById(MintXWmpAddressId).textContent = getXWmpMintAddress().toBase58();

    document.getElementById(MetadataAddressId).textContent = State.wmpStakingData?.metadata.toBase58();
    document.getElementById(StakingTokenId).textContent = State.wmpStakingData?.wmpMintAddress.toBase58();
    document.getElementById(RewardsTokenId).textContent = State.wmpStakingData?.xWmpMintAddress.toBase58();
    document.getElementById(EscrowStakingTokenId).textContent = State.wmpStakingData?.wmpEscrowAddress.toBase58();
    document.getElementById(EscrowRewardsTokenId).textContent = State.wmpStakingData?.xWmpEscrowAddress.toBase58();
    document.getElementById(LastUpdatedTimeId).textContent = State.stakingMetadata?.lastUpdateTimestamp.toUTCString();
    // document.getElementById(RewardRateId).textContent = State.stakingMetadata?.rewardRate.toString();
    // document.getElementById(RewardsPerTokenStoredId).textContent = State.stakingMetadata?.rewardPerTokenStored.toString();
    document.getElementById(TotalSupplyId).textContent = State.stakingMetadata?.totalSupply.toString();

    if (State.userWmpAccount != null) {
        document.getElementById(UserWmpAddress).textContent = State.userWmpAccount.address.toBase58();
        document.getElementById(UserWmpBalance).textContent = State.userWmpAccount.amount.toString();

        document.getElementById(WmpAddressExistsBlockId).style.display = "block";
        document.getElementById(CreateWmpAccountBlockId).style.display = "none";
    } else {
        document.getElementById(WmpAddressExistsBlockId).style.display = "none";
        document.getElementById(CreateWmpAccountBlockId).style.display = "block";
    }

    if (State.userXWmpAccount != null) {
        document.getElementById(UserXWmpAddress).textContent = State.userXWmpAccount.address.toBase58();
        document.getElementById(UserXWmpBalance).textContent = State.userXWmpAccount.amount.toString();

        document.getElementById(XWmpAddressExistsBlockId).style.display = "block";
        document.getElementById(CreateXWmpAccountBlockId).style.display = "none";
    } else {
        document.getElementById(XWmpAddressExistsBlockId).style.display = "none";
        document.getElementById(CreateXWmpAccountBlockId).style.display = "block";
    }

    if (State.userState != null) {
        document.getElementById(UserStakedBalance).textContent = State.userState.balance.toString();
        document.getElementById(UserRewardsBalance).textContent = State.userState.rewards.toString();
        // document.getElementById(UserRewardPerTokenPaid).textContent = State.userState.rewardPerTokenPaid.toString();
    } 
}

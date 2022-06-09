
pub mod rewards {
    use crate::UnixTimestamp;
    use anchor_lang::prelude::*;
    use crate::UserState;
    use crate::GlobalState;

    pub fn update_rewards(state: &mut GlobalState, user_state: &mut UserState) -> Result<()> {
        let rewards_per_token_stored = reward_per_token(&state);
        let last_update_timestamp = Clock::get().unwrap().unix_timestamp;

        state.reward_per_token_stored = rewards_per_token_stored;
        state.last_update_timestamp = last_update_timestamp;

        let new_rewards = earned(&state, &user_state);
        user_state.rewards = new_rewards;

        Ok(())
    }

    fn reward_per_token(state: &GlobalState) -> u64 {
        return calc_reward_per_token(state.total_supply, state.reward_per_token_stored, state.last_update_timestamp, state.reward_rate);
    }

    fn calc_reward_per_token(total_supply: u64, rewards_per_token_stored: u64, last_update_timestamp: UnixTimestamp, reward_rate: u64) -> u64 {
        let current_timestamp = Clock::get().unwrap().unix_timestamp; 
        
        if total_supply == 0 {
            return 0;
        }

        let rewards_per_token = rewards_per_token_stored + (((current_timestamp - last_update_timestamp) as u64) * reward_rate) / total_supply;
        
        rewards_per_token
    }

    fn earned(state: &GlobalState, user_state: &UserState) -> u64 {
        return calc_earned(
            user_state.balance, 
            state.total_supply, 
            state.reward_per_token_stored, 
            state.last_update_timestamp, 
            user_state.reward_per_token_paid, 
            user_state.rewards,
            state.reward_rate);
    }

    fn calc_earned(
        stake_amount: u64, 
        total_supply: u64, 
        rewards_per_token_stored: u64, 
        last_update_timestamp: UnixTimestamp, 
        user_reward_per_token_paid: u64, 
        user_rewards: u64,
        reward_rate: u64) -> u64 {
        let rewards_per_token = calc_reward_per_token(total_supply, rewards_per_token_stored, last_update_timestamp, reward_rate);
        let earned = stake_amount * ( rewards_per_token - user_reward_per_token_paid) + user_rewards;

        earned
    }
}
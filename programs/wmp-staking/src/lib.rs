use anchor_lang::prelude::*;
use anchor_lang::system_program::System;
use anchor_lang::solana_program::{
    clock::UnixTimestamp,    
};

use anchor_spl::token::{
    Mint, 
    TokenAccount,
    Token
};

use std::mem::size_of;

mod rewards;

declare_id!("EA6rPzuLa1riBUEwo2C4jRaHeZBkSEuAJCrqwEyWNMn5");

#[program]
pub mod wmp_staking {
    use crate::rewards::rewards::update_rewards;
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, reward_rate: u64) -> Result<()> {
        ctx.accounts.metadata.admin = *ctx.accounts.admin.as_ref().key;
        ctx.accounts.metadata.staking_token_mint = ctx.accounts.staking_token_mint.key();
        ctx.accounts.metadata.reward_token_mint = ctx.accounts.rewards_token_mint.key();
        ctx.accounts.metadata.total_supply = 0;
        ctx.accounts.metadata.reward_per_token_stored = 0;
        ctx.accounts.metadata.reward_rate = reward_rate;
        ctx.accounts.metadata.last_update_timestamp = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        {
            update_rewards(&mut ctx.accounts.metadata, &mut ctx.accounts.user_state)?;
        }

        let transfer_accounts = anchor_spl::token::Transfer {
            from: ctx.accounts.user_staking_token.to_account_info(),
            to: ctx.accounts.escrow_staking_token.to_account_info(),
            authority: ctx.accounts.user.to_account_info()
        };

        let transfer_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts);

        anchor_spl::token::transfer(transfer_ctx, amount)?;

        let user_state = &mut ctx.accounts.user_state;
        user_state.balance += amount;

        let global_state = &mut ctx.accounts.metadata;
        global_state.total_supply += amount;
        global_state.last_update_timestamp = Clock::get().unwrap().unix_timestamp;
        
        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64, metadata_bump: u8) -> Result<()> {
        update_rewards(&mut ctx.accounts.metadata, &mut ctx.accounts.user_state)?;

        let ctx_accounts =  anchor_spl::token::Transfer {
            from: ctx.accounts.escrow_staking_token.to_account_info(),
            to: ctx.accounts.user_staking_token.to_account_info(),
            authority: ctx.accounts.metadata.to_account_info()
        };

        let seeds = &[
            ctx.accounts.staking_token_mint.to_account_info().key.as_ref(),
            ctx.accounts.rewards_token_mint.to_account_info().key.as_ref(),
            b"metadata".as_ref(),
            &[metadata_bump],
        ];

        let signer = &[&seeds[..]];
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            ctx_accounts, 
            signer);

        anchor_spl::token::transfer(transfer_ctx, amount)?;

        let user_state = &mut ctx.accounts.user_state;
        user_state.balance -= amount;

        let global_state = &mut ctx.accounts.metadata;
        global_state.total_supply -= amount;
        global_state.last_update_timestamp = Clock::get().unwrap().unix_timestamp;

        Ok(())
    }

    pub fn get_rewards(ctx: Context<GetRewards>, metadata_bump: u8) -> Result<()> {
        update_rewards(&mut ctx.accounts.metadata, &mut ctx.accounts.user_state)?;

        let user_state = &mut ctx.accounts.user_state;

        let ctx_accounts =  anchor_spl::token::Transfer {
            from: ctx.accounts.escrow_rewards_token.to_account_info(),
            to: ctx.accounts.user_rewards_token.to_account_info(),
            authority: ctx.accounts.metadata.to_account_info()
        };

        let seeds = &[
            ctx.accounts.staking_token_mint.to_account_info().key.as_ref(),
            ctx.accounts.rewards_token_mint.to_account_info().key.as_ref(),
            b"metadata".as_ref(),
            &[metadata_bump],
        ];

        let signer = &[&seeds[..]];
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            ctx_accounts, 
            signer);

        anchor_spl::token::transfer(transfer_ctx, user_state.rewards)?;

        user_state.rewards = 0;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init, 
        payer = admin, 
        space = size_of::<GlobalState>() + 8,
        seeds = [staking_token_mint.key().to_bytes().as_ref(), rewards_token_mint.key().to_bytes().as_ref(), b"metadata"], 
        bump
    )]
    pub metadata: Account<'info, GlobalState>,

    #[account()]
    pub staking_token_mint: Account<'info, Mint>,

    #[account()]
    pub rewards_token_mint: Account<'info, Mint>,

    #[account(
        init, 
        payer = admin, 
        token::mint = staking_token_mint, 
        token::authority = metadata,
        seeds = [staking_token_mint.key().to_bytes().as_ref(), b"staking-token"], 
        bump)]
    pub escrow_staking_token: Account<'info, TokenAccount>,

    #[account(
        init, 
        payer = admin, 
        token::mint = rewards_token_mint, 
        token::authority = metadata,
        seeds = [rewards_token_mint.key().to_bytes().as_ref(), b"rewards-token"], 
        bump
    )]
    pub escrow_rewards_token: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        token::mint = staking_token_mint, 
        token::authority = user
    )]
    pub user_staking_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = staking_token_mint, 
        token::authority = metadata
    )]
    pub escrow_staking_token: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = size_of::<UserState>() + 8,
        seeds = [metadata.key().to_bytes().as_ref(), user.key().to_bytes().as_ref(), b"user-state"],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(mut)]
    pub metadata: Account<'info, GlobalState>,

    #[account()]
    pub staking_token_mint: Account<'info, Mint>,

    #[account()]
    pub token_program: Program<'info, Token>,

    #[account()]
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        token::mint = staking_token_mint,
        token::authority = user
    )]
    pub user_staking_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [metadata.key().to_bytes().as_ref(), user.key().to_bytes().as_ref(), b"user-state"],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(mut)]
    pub metadata: Account<'info, GlobalState>,

    #[account(
        mut,
        token::mint = staking_token_mint,
        token::authority = metadata
    )]
    pub escrow_staking_token: Account<'info, TokenAccount>,

    #[account()]
    pub staking_token_mint: Account<'info, Mint>,

    #[account()]
    pub rewards_token_mint: Account<'info, Mint>,

    #[account()]
    pub token_program: Program<'info, Token>
}

#[derive(Accounts)]
pub struct GetRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        token::mint = rewards_token_mint,
        token::authority = user
    )]
    pub user_rewards_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [metadata.key().to_bytes().as_ref(), user.key().to_bytes().as_ref(), b"user-state"],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(mut)]
    pub metadata: Account<'info, GlobalState>,

    #[account(
        mut,
        token::mint = rewards_token_mint,
        token::authority = metadata
    )]
    pub escrow_rewards_token: Account<'info, TokenAccount>,

    #[account()]
    pub staking_token_mint: Account<'info, Mint>,

    #[account()]
    pub rewards_token_mint: Account<'info, Mint>,

    #[account()]
    pub token_program: Program<'info, Token>
}

#[account]
pub struct GlobalState {
    pub admin: Pubkey,
    pub staking_token_mint: Pubkey,
    pub reward_token_mint: Pubkey,
    pub total_supply: u64, 
    pub reward_per_token_stored: u64,
    pub reward_rate: u64,
    pub last_update_timestamp: UnixTimestamp
}

#[account]
pub struct UserState {
    pub balance: u64, 
    pub reward_per_token_paid: u64,
    pub rewards: u64,
}
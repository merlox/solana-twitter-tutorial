use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod tweet {
    use super::*;
    pub fn initialize(ctx: Context<TweetController>) -> ProgramResult {
        let tweet = &mut ctx.accounts.tweet;
        tweet.likes = 0;
        tweet.message = ("").to_string();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TweetController<'info> {
    #[account(init, payer = user, space = 9000)]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
#[derive(Default)]
pub struct Tweet {
    message: String,
    likes: u128,
}
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod tweet {
    use super::*;
    pub fn setup_platform(ctx: Context<TweetController>) -> ProgramResult {
        let tweet = &mut ctx.accounts.tweet;
        tweet.likes = 0;
        tweet.message = ("").to_string();
        Ok(())
    }

    pub fn write_my_tweet(
        ctx: Context<WriteTweet>,
        message: String,
        sender: Pubkey
    ) -> ProgramResult {
        let tweet = &mut ctx.accounts.tweet;

        if !tweet.message.trim().is_empty() {
            return Err(Errors::CantUpdateTweet.into());
        }
        if message.trim().is_empty() {
            return Err(Errors::NoMessage.into());
        }

        tweet.message = message;
        tweet.likes = 0;
        tweet.creator = sender;

        Ok(())
    }

    pub fn like_my_tweet(
        ctx: Context<LikeTweet>,
        user_liking_tweet: Pubkey
    ) -> ProgramResult {
        let tweet = &mut ctx.accounts.tweet;

        if tweet.message.trim().is_empty() {
            return Err(Errors::InvalidTweet.into());
        }

        if tweet.likes >= 5 {
            return Err(Errors::MaxLikesReached.into());
        }

        let mut iter = tweet.people_that_liked.iter();
        if iter.any(|&v| v == user_liking_tweet) {
            return Err(Errors::UserLikedAlready.into());
        }

        tweet.likes += 1;
        tweet.people_that_liked.push(user_liking_tweet);

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
pub struct WriteTweet<'info> {
    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
}

#[derive(Accounts)]
pub struct LikeTweet<'info> {
    #[account(mut)]
    pub tweet: Account<'info, Tweet>
}

#[account]
#[derive(Default)]
pub struct Tweet {
    message: String,
    likes: u128,
    creator: Pubkey,
    // with  #[derive(Default)] we can assign default values
    people_that_liked: Vec<Pubkey>,
}

#[error]
pub enum Errors {
    #[msg("That tweet message can't be updated")]
    CantUpdateTweet,
    #[msg("The tweet message can't be empty")]
    NoMessage,
    #[msg("Can't like a tweet without a valid message")]
    InvalidTweet,
    #[msg("That tweet has received the maximum amount of likes already")]
    MaxLikesReached,
    #[msg("The user liked the tweet already")]
    UserLikedAlready,
}
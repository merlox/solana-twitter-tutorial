import * as anchor from '@project-serum/anchor'
import { Program } from '@project-serum/anchor'
import { Tweet } from '../target/types/tweet'
import { expect, assert } from 'chai'

describe('tweet', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env())

  const program = anchor.workspace.Tweet as Program<Tweet>

  it('should setup the tweets platform', async () => {
    const tweetKeypair = anchor.web3.Keypair.generate()
    const user = program.provider.wallet
    await program.rpc.setupPlatform({
      accounts: {
        tweet: tweetKeypair.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweetKeypair],
    })

    let tweet = await program.account.tweet.fetch(tweetKeypair.publicKey)
    expect(Number(tweet.likes)).to.equal(0)
    expect(tweet.message).to.equal('')
  })

  it('should write a tweet', async () => {
    const tweetKeypair = anchor.web3.Keypair.generate()
    const user = program.provider.wallet
    await program.rpc.setupPlatform({
      accounts: {
        tweet: tweetKeypair.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweetKeypair],
    })

    let tweet = await program.account.tweet.fetch(tweetKeypair.publicKey)
    expect(Number(tweet.likes)).to.equal(0)
    expect(tweet.message).to.equal('')

    await program.rpc.writeMyTweet('Hola tweet', user.publicKey, {
      accounts: {
        tweet: tweetKeypair.publicKey,
      },
      signers: [],
    })
    tweet = await program.account.tweet.fetch(tweetKeypair.publicKey)
    
    expect(Number(tweet.likes)).to.equal(0)
    expect(tweet.message).to.equal('Hola tweet')
    expect(tweet.creator.toString()).to.equal(user.publicKey.toString())
  })

  it('should like a tweet up to 5 times', async () => {
    const tweetKeypair = anchor.web3.Keypair.generate()
    const user = program.provider.wallet
    await program.rpc.setupPlatform({
      accounts: {
        tweet: tweetKeypair.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweetKeypair],
    })

    let tweet = await program.account.tweet.fetch(tweetKeypair.publicKey)
    expect(Number(tweet.likes)).to.equal(0)
    expect(tweet.message).to.equal('')

    await program.rpc.writeMyTweet('Hola tweet', user.publicKey, {
      accounts: {
        tweet: tweetKeypair.publicKey,
      },
      signers: [],
    })
    tweet = await program.account.tweet.fetch(tweetKeypair.publicKey)

    await program.rpc.likeMyTweet(user.publicKey, {
      accounts: {
        tweet: tweetKeypair.publicKey,
      },
      signers: [],
    })
    tweet = await program.account.tweet.fetch(tweetKeypair.publicKey)

    expect(Number(tweet.likes)).to.equal(1)

    try {
      await program.rpc.likeMyTweet(user.publicKey, {
        accounts: {
          tweet: tweetKeypair.publicKey,
        },
        signers: [],
      })
    } catch (e) {
      const expectedErr = 'The user liked the tweet already' // Frmo the lib.rs Errors
      assert.equal(e.toString(), expectedErr)
    }

    for (let i = 0; i < 4; i++) {
      const newUser = anchor.web3.Keypair.generate()
      await program.rpc.likeMyTweet(newUser.publicKey, {
        accounts: {
          tweet: tweetKeypair.publicKey,
        },
        signers: [],
      })
    }

    // Try to like a 6th time to see if it allows it or not
    try {
      const newUser = anchor.web3.Keypair.generate()
      await program.rpc.likeMyTweet(newUser.publicKey, {
        accounts: {
          tweet: tweetKeypair.publicKey,
        },
        signers: [],
      })
      assert.fail('Should not allow to like more than 6 times')
    } catch (e) {
      const expectedError = 'That tweet has received the maximum amount of likes already'
      expect(e.toString()).to.equal(expectedError)
    }
  })

  it('should not allow empty tweets', async () => {
    const tweetKeypair = anchor.web3.Keypair.generate()
    const user = program.provider.wallet
    await program.rpc.setupPlatform({
      accounts: {
        tweet: tweetKeypair.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [tweetKeypair],
    })

    let tweet = await program.account.tweet.fetch(tweetKeypair.publicKey)
    expect(Number(tweet.likes)).to.equal(0)
    expect(tweet.message).to.equal('')

    try {
      await program.rpc.writeMyTweet('', user.publicKey, {
        accounts: {
          tweet: tweetKeypair.publicKey,
        },
        signers: [],
      })
      assert.fail('Should not allow empty tweets')
    } catch (e) {
      const expectedError = "The tweet message can't be empty"
      expect(e.toString()).to.equal(expectedError)
    }
  })
})

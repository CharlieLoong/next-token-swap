import {
  Keypair,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  approve,
  createMint,
  createAccount,
  createApproveInstruction,
  createInitializeAccountInstruction,
  getAccount,
  getMint,
  getMinimumBalanceForRentExemptAccount,
  mintTo,
  AccountLayout,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { TokenSwap, CurveType } from './index';

import _tokenList from '@/constants/token-list.json';

const token_list = _tokenList['testnet'];

// The following globals are created by `createTokenSwap` and used by subsequent tests
// Token swap
let tokenSwap: TokenSwap;
// authority of the token and accounts
let authority: PublicKey;
// bump seed used to generate the authority public key
let bumpSeed: number;
// owner of the user accounts
export let owner: Keypair;
// payer for transactions
export let payer: Keypair;
// Token pool
let tokenPool: PublicKey;
let tokenAccountPool: PublicKey;
// 收手续费的
let feeAccount: PublicKey;
// Tokens swapped
let mintA: PublicKey;
const mintAProgramId: PublicKey = TOKEN_PROGRAM_ID;
let mintB: PublicKey;
const mintBProgramId: PublicKey = TOKEN_PROGRAM_ID;
let tokenAccountA: PublicKey;
let tokenAccountB: PublicKey;

//TOKEN_SWAP_PROGRAM_ID
const TOKEN_SWAP_PROGRAM_ID = new PublicKey(
  'FEsDFQLek6gUpNcWtGRxaaqG59dJdzZysadS8V3pAzX3',
);

// Hard-coded fee address, for testing production mode
const SWAP_PROGRAM_OWNER_FEE_ADDRESS =
  process.env.SWAP_PROGRAM_OWNER_FEE_ADDRESS;

// Pool fees
const TRADING_FEE_NUMERATOR = 25n;
const TRADING_FEE_DENOMINATOR = 10000n;
const OWNER_TRADING_FEE_NUMERATOR = 5n;
const OWNER_TRADING_FEE_DENOMINATOR = 10000n;
const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0n : 1n;
const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0n : 6n;
const HOST_FEE_NUMERATOR = 20n;
const HOST_FEE_DENOMINATOR = 100n;

// Initial amount in each swap token
let currentSwapTokenA = 1000000n;
let currentSwapTokenB = 1000000n;
let currentFeeAmount = 0n;

// Swap instruction constants
// Because there is no withdraw fee in the production version, these numbers
// need to get slightly tweaked in the two cases.
const SWAP_AMOUNT_IN = 100000n;
const SWAP_AMOUNT_OUT = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 90661n : 90674n;
const SWAP_FEE = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 22727n : 22730n;
const HOST_SWAP_FEE = SWAP_PROGRAM_OWNER_FEE_ADDRESS
  ? (SWAP_FEE * HOST_FEE_NUMERATOR) / HOST_FEE_DENOMINATOR
  : 0n;
const OWNER_SWAP_FEE = SWAP_FEE - HOST_SWAP_FEE;

// Pool token amount minted on init
const DEFAULT_POOL_TOKEN_AMOUNT = 1000000000n;
// Pool token amount to withdraw / deposit
export const POOL_TOKEN_AMOUNT = 10000000n;
// My Solana CLI wallet
export const myKeyPair = Keypair.fromSecretKey(
  new Uint8Array([
    3, 214, 74, 243, 144, 149, 32, 172, 0, 247, 213, 30, 247, 113, 101, 145, 32,
    188, 239, 212, 253, 213, 98, 9, 183, 181, 176, 241, 50, 212, 14, 84, 155,
    38, 217, 68, 14, 98, 119, 40, 203, 199, 47, 174, 255, 192, 179, 138, 67, 39,
    144, 117, 214, 193, 205, 79, 223, 227, 13, 64, 234, 49, 82, 255,
  ]),
);

/**
 * 使用测试币 A,B,LP
 */

// tokenPool = new PublicKey('966QCJrzURx1jrPKmMrtV2He1Ng6dcbhY9gBz3Y3fJFX'); //new PublicKey(token_list[3].mintAddress); //TODO

// tokenAccountPool = new PublicKey(token_list[3].tokenAccount); // TODO

mintA = new PublicKey('WgJ4QZ2SqDomPToBn2cjqjnXETNiHxPdh35mBsCdqgk');
//new PublicKey(token_list[1].mintAddress);

// tokenAccountA = new PublicKey(token_list[1].tokenAccount);

mintB = new PublicKey('VfkeR5txoVnrHrrEKVmnfZ2jcJY5vWqEeqmV4cfJtQH');
//new PublicKey(token_list[2].mintAddress);

// tokenAccountB = new PublicKey(token_list[2].tokenAccount);

payer = owner = myKeyPair;

import swapKeypair from '@/constants/spl_token_swap-keypair.json';
import { WalletContextState } from '@solana/wallet-adapter-react';

let connection: Connection;

async function getConnection(): Promise<Connection> {
  if (connection) return connection;

  const url = 'https://testnet.dev2.eclipsenetwork.xyz'; // TODO

  connection = new Connection(url, 'recent');
  const version = await connection.getVersion();

  console.log('Connection to cluster established:', url, version);
  return connection;
}

export async function createTokenSwap(
  connection: Connection,
  curveType: number,
  curveParameters?: Uint8Array,
) {
  // const connection = await getConnection();

  const tokenSwapAccount = Keypair.generate();

  [authority, bumpSeed] = PublicKey.findProgramAddressSync(
    [tokenSwapAccount.publicKey.toBuffer()],
    TOKEN_SWAP_PROGRAM_ID,
  );

  console.log('creating pool mint');
  tokenPool = await createMint(
    connection,
    payer,
    authority,
    null,
    2,
    Keypair.generate(),
    undefined,
    TOKEN_PROGRAM_ID,
  );

  console.log('creating pool account');
  tokenAccountPool = await createAccount(
    connection,
    payer,
    tokenPool,
    owner.publicKey,
    Keypair.generate(),
  );

  const ownerKey = SWAP_PROGRAM_OWNER_FEE_ADDRESS || owner.publicKey.toString();
  feeAccount = myKeyPair.publicKey;
  feeAccount = await createAccount(
    connection,
    payer,
    tokenPool,
    new PublicKey(ownerKey),
    Keypair.generate(),
  );
  console.log(feeAccount.toString());

  // console.log('creating token A');
  // mintA = await createMint(
  //   connection,
  //   payer,
  //   owner.publicKey,
  //   null,
  //   2,
  //   Keypair.generate(),
  //   undefined,
  //   mintAProgramId,
  // );

  console.log('creating token A account');
  tokenAccountA = await createAccount(
    connection,
    payer,
    mintA,
    authority,
    Keypair.generate(),
  );
  console.log('minting token A to swap');
  await mintTo(
    connection,
    payer,
    mintA,
    tokenAccountA,
    owner,
    currentSwapTokenA,
  );

  // console.log('creating token B');
  // mintB = await createMint(
  //   connection,
  //   payer,
  //   owner.publicKey,
  //   null,
  //   2,
  //   Keypair.generate(),
  //   undefined,
  //   mintBProgramId,
  // );

  console.log('creating token B account');
  tokenAccountB = await createAccount(
    connection,
    payer,
    mintB,
    authority,
    Keypair.generate(),
  );
  console.log('minting token B to swap');
  await mintTo(
    connection,
    payer,
    mintB,
    tokenAccountB,
    owner,
    currentSwapTokenB,
  );

  console.log('creating token swap');
  const swapPayer = myKeyPair;
  tokenSwap = await TokenSwap.createTokenSwap(
    connection,
    swapPayer,
    tokenSwapAccount,
    authority,
    tokenAccountA,
    tokenAccountB,
    tokenPool,
    mintA,
    mintB,
    feeAccount,
    tokenAccountPool,
    TOKEN_SWAP_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    TRADING_FEE_NUMERATOR,
    TRADING_FEE_DENOMINATOR,
    OWNER_TRADING_FEE_NUMERATOR,
    OWNER_TRADING_FEE_DENOMINATOR,
    OWNER_WITHDRAW_FEE_NUMERATOR,
    OWNER_WITHDRAW_FEE_DENOMINATOR,
    HOST_FEE_NUMERATOR,
    HOST_FEE_DENOMINATOR,
    curveType,
    curveParameters,
  );
  return tokenSwap;
}

// export async function test() {
//   await createTokenSwap(CurveType.ConstantProduct);
//   console.log('test complete');
// }
export async function fetchTokenSwap(
  connection: Connection,
  tokenSwapAccount: PublicKey | string,
) {
  if (typeof tokenSwapAccount === 'string')
    tokenSwapAccount = new PublicKey(tokenSwapAccount);
  const fetchedTokenSwap = await TokenSwap.loadTokenSwap(
    connection,
    tokenSwapAccount,
    TOKEN_SWAP_PROGRAM_ID,
    payer,
  );
  return fetchedTokenSwap;
}

export async function depositAllTokenTypes(
  connection: Connection,
  tokenSwap: TokenSwap,
  wallet: WalletContextState,
): Promise<void> {
  const poolMintInfo = await getMint(connection, tokenSwap.poolToken);
  const supply = poolMintInfo.supply;
  const swapTokenA = await getAccount(connection, tokenSwap.tokenAccountA);
  const tokenA = (swapTokenA.amount * BigInt(POOL_TOKEN_AMOUNT)) / supply;
  const swapTokenB = await getAccount(connection, tokenSwap.tokenAccountB);
  const tokenB = (swapTokenB.amount * BigInt(POOL_TOKEN_AMOUNT)) / supply;

  const userTransferAuthority = Keypair.generate();
  const transaction = new Transaction();
  const user = wallet.publicKey!;

  console.log('Creating depositor token a account');
  const userAccountA = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintA,
    user,
  );
  // await mintTo(connection, payer, mintA, userAccountA.address, owner, tokenA);
  // await approve(
  //   connection,
  //   payer,
  //   userAccountA.address,
  //   userTransferAuthority.publicKey,
  //   user,
  //   tokenA,
  // );
  transaction.add(
    createApproveInstruction(
      userAccountA.address,
      userTransferAuthority.publicKey,
      user,
      tokenA,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );
  console.log('Creating depositor token b account');
  const userAccountB = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintB,
    user,
  );
  // await mintTo(connection, payer, mintB, userAccountB.address, owner, tokenB);
  // await approve(
  //   connection,
  //   payer,
  //   userAccountB.address,
  //   userTransferAuthority.publicKey,
  //   user,
  //   tokenB,
  // );
  transaction.add(
    createApproveInstruction(
      userAccountB.address,
      userTransferAuthority.publicKey,
      user,
      tokenB,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  console.log('Creating depositor pool token account');
  const newAccountPool = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenSwap.poolToken,
    user,
  );

  const confirmOptions = {
    skipPreflight: true,
  };
  console.log('Signing transaction with wallet');
  let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = user;

  await wallet.signTransaction!(transaction);
  await wallet.sendTransaction(transaction, connection);

  console.log('Depositing into swap');
  await tokenSwap.depositAllTokenTypes(
    userAccountA.address,
    userAccountB.address,
    newAccountPool.address,
    TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    userTransferAuthority,
    POOL_TOKEN_AMOUNT,
    tokenA,
    tokenB,
    confirmOptions,
  );
}

export async function withdrawAllTokenTypes(
  connection: Connection,
  tokenSwap: TokenSwap,
): Promise<void> {
  // console.log(tokenSwap);
  const poolMintInfo = await getMint(connection, tokenSwap.poolToken);
  const supply = poolMintInfo.supply;
  let swapTokenA = await getAccount(connection, tokenSwap.tokenAccountA);
  let swapTokenB = await getAccount(connection, tokenSwap.tokenAccountB);
  let feeAmount = 0n;
  if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0n) {
    feeAmount =
      (POOL_TOKEN_AMOUNT * OWNER_WITHDRAW_FEE_NUMERATOR) /
      OWNER_WITHDRAW_FEE_DENOMINATOR;
  }
  const poolTokenAmount = POOL_TOKEN_AMOUNT - feeAmount;
  const tokenA = (swapTokenA.amount * BigInt(poolTokenAmount)) / supply;
  const tokenB = (swapTokenB.amount * BigInt(poolTokenAmount)) / supply;

  console.log('Creating withdraw token A account');
  const userAccountA = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintA,
    owner.publicKey,
  );
  console.log('Creating withdraw token B account');
  const userAccountB = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintB,
    owner.publicKey,
  );
  const tokenAccountPool = (
    await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      tokenSwap.poolToken,
      owner.publicKey,
    )
  ).address;
  const userTransferAuthority = Keypair.generate();
  console.log('Approving withdrawal from pool account');
  await approve(
    connection,
    payer,
    tokenAccountPool,
    userTransferAuthority.publicKey,
    owner,
    POOL_TOKEN_AMOUNT,
  );

  const confirmOptions = {
    skipPreflight: true,
  };

  console.log('Withdrawing pool tokens for A and B tokens');
  await tokenSwap.withdrawAllTokenTypes(
    userAccountA.address,
    userAccountB.address,
    tokenAccountPool,
    TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    userTransferAuthority,
    POOL_TOKEN_AMOUNT,
    tokenA,
    tokenB,
    confirmOptions,
  );

  //const poolMintInfo = await tokenPool.getMintInfo();
  // swapTokenA = await getAccount(connection, tokenAccountA);
  // swapTokenB = await getAccount(connection, tokenAccountB);

  // let info = await getAccount(connection, tokenAccountPool);
  // assert(info.amount == DEFAULT_POOL_TOKEN_AMOUNT - POOL_TOKEN_AMOUNT);
  // assert(swapTokenA.amount == currentSwapTokenA - tokenA);
  // currentSwapTokenA -= tokenA;
  // assert(swapTokenB.amount == currentSwapTokenB - tokenB);
  // currentSwapTokenB -= tokenB;
  // info = await getAccount(connection, userAccountA);
  // assert(info.amount == tokenA);
  // info = await getAccount(connection, userAccountB);
  // assert(info.amount == tokenB);
  // info = await getAccount(connection, feeAccount);
  // assert(info.amount == feeAmount);
  // currentFeeAmount = feeAmount;
}

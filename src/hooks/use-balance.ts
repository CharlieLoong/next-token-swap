import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { throttle } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

export function useBalance(owner: PublicKey, token: string | PublicKey) {
  const connection = useConnection().connection;
  const [tokenBalance, setTokenBalance] = useState(0);

  async function _getBalance() {
    console.log('get balance');
    if (owner == null) return 0;
    const response = await connection.getParsedTokenAccountsByOwner(owner, {
      // this filter get All tokens
      // programId: TOKEN_PROGRAM_ID,
      mint: new PublicKey(token),
    });
    let value: number = 0;
    if (response.value.length) {
      value = response.value[0].account.data.parsed.info.tokenAmount.uiAmount;
      setTokenBalance(
        response.value[0].account.data.parsed.info.tokenAmount.uiAmount,
      );
    }
    // console.log(response);
    return value;
  }
  const getBalance = useCallback(
    throttle(_getBalance, 1000), // 查询余额间隔
    [owner, token],
  ); // TODO: 解决throttle不生效问题，不知道方法对不对

  useEffect(() => {
    getBalance();
  }, [owner, token]); // TODO

  return [tokenBalance, getBalance] as const;
}

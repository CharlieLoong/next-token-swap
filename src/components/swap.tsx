import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { useMint } from '@/hooks/use-mint';
import { HTMLProps, ReactNode, useEffect, useState } from 'react';
import { useBalance } from '@/hooks/use-balance';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useSwap } from '@/hooks/use-swap';
import {
  ChevronsUpDown,
  Loader,
  Loader2,
  Pointer,
  Settings,
} from 'lucide-react';
import { debounce } from 'lodash';
import { useSetting } from '@/hooks/use-setting';
import { Button } from './ui/button';
import { swap } from '@/lib/token-swap/lib';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

type SwapProps = {};

const PRECISION = 100; // TODO
const TOKENS = {
  A: 'WgJ4QZ2SqDomPToBn2cjqjnXETNiHxPdh35mBsCdqgk',
  B: 'VfkeR5txoVnrHrrEKVmnfZ2jcJY5vWqEeqmV4cfJtQH',
}; // TODO: db

export default function Swap({}: SwapProps) {
  const { mintA, mintB } = useMint();
  const wallet = useWallet();
  const tokenSwap = useSwap();
  const connection = useConnection().connection;
  const { slippage, setSlippage } = useSetting();

  const [pending, setPending] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [InsufficientBalance, setInsufficientBalance] = useState(false);
  const [InsufficientLiquidity, setInsufficientLiquidity] = useState(false);

  const [inputA, setInputA] = useState<number>(0);
  const [inputB, setInputB] = useState<number>(0);

  const [buttonContent, setButtonContent] = useState<ReactNode>('Swap');

  const [tokenA, setTokenA] = useState(TOKENS.A);
  const [tokenB, setTokenB] = useState(TOKENS.B);

  const [balanceA, getBalanceA] = useBalance(wallet.publicKey!, tokenA);
  const [balanceB, getBalanceB] = useBalance(wallet.publicKey!, tokenB);

  const [poolBalanceA, getPoolBalanceA] = useBalance(
    tokenSwap?.authority,
    tokenA,
  );
  const [poolBalanceB, getPoolBalanceB] = useBalance(
    tokenSwap?.authority,
    tokenB,
  );

  const calculateOutput = debounce(async (input: number) => {
    setCalculating(true);
    if (input === 0 || !input) return;
    // const poolBalanceA = await connection.getBalance(tokenSwap?.tokenAccountA!);
    // const poolBalanceB = await connection.getBalance(tokenSwap?.tokenAccountB!);
    await getPoolBalanceA();
    await getPoolBalanceB();
    const estimateB = (input * poolBalanceB) / (input + poolBalanceA);
    setInputB(estimateB);
    setCalculating(false);
  }, 500);
  const calculateInput = debounce(async (output: number) => {
    setCalculating(true);
    if (output === 0 || !output) return;
    await getPoolBalanceA();
    await getPoolBalanceB();
    if (output > poolBalanceB) {
      setButtonContent('Insufficient Liquidity');
      setCalculating(false);
      return;
    }
    const estimateA = (output * poolBalanceA) / (poolBalanceB - output);
    setInputA(estimateA);
    setCalculating(false);
  }, 500);
  // useEffect(() => {
  //   calculateOutput();

  //   return () => {
  //     calculateOutput.cancel();
  //   };
  // }, [inputA]);

  async function handleSwap() {
    if (!tokenSwap || !inputA || !inputB) return toast.error('Lack of Input');
    toast('Handling Swap');
    setPending(true);
    try {
      await swap(
        connection,
        tokenSwap,
        wallet,
        new PublicKey(tokenA),
        new PublicKey(tokenB),
        BigInt(Math.floor(inputA * PRECISION)), // TODO: 不同Token位数精度不同
        BigInt(Math.round(inputB * PRECISION * (1 - slippage))),
      );
      const prevBalanceA = balanceA;
      const prevBalanceB = balanceB;
      console.log(prevBalanceA, prevBalanceB);
      const curA = await getBalanceA();
      const curB = await getBalanceB();
      console.log(prevBalanceA, prevBalanceB);
      const pay = prevBalanceA - curA;
      const receive = curB - prevBalanceB;
      console.log(pay, receive);
      toast.success('Swap Success', {
        description: (
          <>
            <p>Pay: {pay}</p>
            <p>Receive: {receive}</p>
          </>
        ),
      });
    } catch (e) {
      console.error(e);
      toast.error('Swap Failed: ', {
        description: <p>{e.toString()}</p>,
      });
    } finally {
      setPending(false);
      setInputA(0);
      setInputB(0);
    }
  }

  function exchangeOrder() {
    setInputA(0);
    setInputB(0);
    setTokenA(tokenB);
    setTokenB(tokenA);
  }

  useEffect(() => {
    if (inputA === 0 && inputB === 0) setButtonContent('Enter an amount');
    if (inputA > balanceA) {
      setInsufficientBalance(true);
      setButtonContent('Insufficient Balance');
    } else {
      setButtonContent('Swap');
    }
  }, [inputA, inputB, balanceA]);

  if (!tokenSwap) {
    return <Loader2 className="animate-spin" />;
  }
  return (
    <div className="flex flex-col py-3 px-2 border rounded-lg w-96">
      <div className="flex justify-between">
        <div className="self-center px-2">Swap</div>
        <DropdownMenu>
          <DropdownMenuTrigger className="">
            <Button variant={'icon'} size={'icon'} className="">
              <Settings />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="p-2 bg-background z-20 rounded-lg border"
          >
            <div className="w-64">
              <Label htmlFor="slippage">Max.Slippage:</Label>
              <Input
                className="relative"
                name="slippage"
                placeholder={(slippage * 100).toFixed(1)}
                onChange={(e) => setSlippage(Number(e.target.value) / 100)}
                inputMode="numeric"
              ></Input>
              <span className="absolute right-5 top-1/2">%</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* <div className="border rounded-lg p-4 flex flex-col">
        <Label htmlFor="inputA">Token A (You Pay)</Label>
        <div className="flex gap-4">
          <Input
            className="border-none"
            name="inputA"
            type="number"
            min={0}
            step={0.01}
            value={inputA}
            onChange={(e) => {
              setInputA(Number(e.target.value));
            }}
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0"
          ></Input>
          <Select value={'0'} onValueChange={(e) => {}}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="InputToken" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">mintA</SelectItem>
              <SelectItem value="1">mintB</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          Balance: {balanceA.toFixed(2)}
        </div>
      </div> */}
      <TokenInput
        text={'You Pay'}
        input={inputA}
        setInput={setInputA}
        balance={balanceA}
        selectedToken={tokenA}
        setSelectedToken={setTokenA}
        effect={calculateOutput}
      />
      <div className="flex justify-center -my-4 z-10">
        <Button variant={'outline'} onClick={exchangeOrder}>
          <ChevronsUpDown />
        </Button>
      </div>
      <TokenInput
        text="You Receive"
        input={inputB}
        setInput={setInputB}
        balance={balanceB}
        selectedToken={tokenB}
        setSelectedToken={setTokenB}
        effect={calculateInput}
      />

      {/* <Label className="border rounded-lg p-4 flex flex-col">
        Token B (You Receive)
        <Input
          disabled
          className="border-none"
          name="inputB"
          type="number"
          min={0}
          step={0.01}
          value={inputB}
          onChange={(e) => {
            setInputB(Number(e.target.value));
          }}
          inputMode="decimal"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder="0"
        ></Input>
        <div className="text-right text-sm text-muted-foreground">
          Balance: {balanceB.toFixed(2)}
        </div>
      </Label> */}
      {/* <p>Slippage: {(slippage * 100).toFixed(1)}%</p> */}
      <Button
        className="mt-1"
        disabled={
          !inputA ||
          !inputB ||
          !tokenSwap ||
          pending ||
          calculating ||
          InsufficientBalance ||
          InsufficientLiquidity
        }
        onClick={handleSwap}
      >
        {pending || calculating ? (
          <Loader2 className="animate-spin" />
        ) : (
          buttonContent
        )}
      </Button>
    </div>
  );
}

type TokenInputProps = {
  text: string;
  input: number;
  setInput: (input: number) => void;
  balance: number;
  selectedToken?: string;
  setSelectedToken: (token: string) => void;
  effect: (input: number) => void;
};
function TokenInput({
  text,
  input,
  setInput,
  balance,
  selectedToken,
  setSelectedToken,
  effect,
}: TokenInputProps) {
  return (
    <div className="border rounded-lg p-4 flex flex-col">
      <Label htmlFor="inputA">{text}</Label>
      <div className="flex gap-4 my-1">
        <Input
          className="border-none"
          name="inputA"
          type="number"
          min={0}
          step={0.01}
          value={input}
          onChange={(e) => {
            setInput(Number(e.target.value));
            effect(Number(e.target.value));
          }}
          inputMode="decimal"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder="0"
        ></Input>
        <Select
          value={selectedToken}
          onValueChange={(e) => {
            setSelectedToken(e);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="select Token" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TOKENS).map(([key, val]) => (
              <SelectItem value={val} key={val}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-right text-sm text-muted-foreground">
        Balance: {balance.toFixed(2)}
      </div>
    </div>
  );
}

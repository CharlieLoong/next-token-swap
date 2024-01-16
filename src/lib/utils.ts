import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PublicKey } from '@solana/web3.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



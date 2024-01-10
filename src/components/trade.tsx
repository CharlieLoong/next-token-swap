import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function Trade() {
  return (
    <form>
      TokenA
      <Input type="number" min="0" />
      TokenB
      <Input type="number" min="0" />
      <Button type="submit">SWAP</Button>
    </form>
  );
}

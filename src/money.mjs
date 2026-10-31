const UNIT=10n**18n;
const MAX=2n**256n-1n;
export function parseAmount(input){
  if(typeof input!=="string"||!/^\d+(\.\d{1,18})?$/.test(input))throw new Error('Enter a plain positive amount with up to 18 decimal places.');
  const [whole,fraction='']=input.split('.');
  const result=BigInt(whole)*UNIT+BigInt(fraction.padEnd(18,'0'));
  if(result>MAX)throw new Error('Amount is too large.');
  return result;
}
export function splitReceipt(amount,bps){
  if(typeof amount!=='bigint'||amount<0n||amount>MAX||!Number.isInteger(bps)||bps<0||bps>10000)throw new Error('Invalid receipt policy.');
  const repayment=amount*BigInt(bps)/10000n;
  return {repayment,operations:amount-repayment};
}
export function money(amount,decimals=2){
  const negative=amount<0n;const n=negative?-amount:amount;
  const whole=(n/UNIT).toLocaleString('en-US');const fraction=(n%UNIT).toString().padStart(18,'0').slice(0,decimals);
  return `${negative?'-':''}${whole}${decimals?'.'+fraction:''}`;
}
export function inputAmount(n){return `${n/UNIT}.${(n%UNIT).toString().padStart(18,'0')}`.replace(/\.?0+$/,'');}
export function available(balance,pending,floor){return balance>pending+floor?balance-pending-floor:0n;}

// Exact payable currency value; summaries may use money(), checkout must not.
export function exactMoney(n){return inputAmount(n);}

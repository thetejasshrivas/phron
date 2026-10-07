import { decodePaise, type Paise } from '@/contracts/money';
/** Decimal-place conversion only; no financial calculation or Number coercion. */
export function rupeesToPaise(value:string):Paise {
  if(!/^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/.test(value)) throw new TypeError('Enter rupees with up to two decimal places.');
  const [whole,fraction='']=value.split('.');
  const result=(whole+fraction.padEnd(2,'0')).replace(/^0+(?=\d)/,'');
  decodePaise(result);
  return result as Paise;
}
export function displayPaise(value:Paise|string):string {
  decodePaise(value);
  const negative=value.startsWith('-'); const digits=(negative?value.slice(1):value).padStart(3,'0');
  return `${negative?'-':''}${digits.slice(0,-2)}.${digits.slice(-2)}`;
}

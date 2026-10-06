declare const paiseBrand: unique symbol;
/** JSON decimal string, never a JS number. Internal calculations use bigint. */
export type Paise = string & { readonly [paiseBrand]: "Paise" };
const minimum = -9223372036854775808n;
const maximum = 9223372036854775807n;

export function decodePaise(value: unknown): bigint {
  if (typeof value !== "string" || !/^(0|-?[1-9][0-9]*)$/.test(value) || value.length > 20) {
    throw new TypeError("Expected canonical integer paise string");
  }
  const amount = BigInt(value);
  if (amount < minimum || amount > maximum) throw new RangeError("Paise exceeds signed 64-bit storage");
  return amount;
}
export function encodePaise(value: bigint): Paise {
  if (typeof value !== "bigint") throw new TypeError("Expected bigint paise without number coercion");
  const wire = value.toString();
  decodePaise(wire);
  return wire as Paise;
}

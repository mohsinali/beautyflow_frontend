export function formatMoney(value: string | number): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        amount,
      )
    : '0.00';
}

export function formatDiscount(value: string | number): string {
  const amount = Math.abs(Number(value));
  return amount > 0 ? `-${formatMoney(amount)}` : formatMoney(0);
}

export function parseMoneyInput(value: string): string {
  return value.replace(/,/g, '').replace(/^-/, '');
}

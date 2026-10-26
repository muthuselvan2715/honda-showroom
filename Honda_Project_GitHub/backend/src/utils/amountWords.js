// Indian numbering system conversion (lakh / crore)
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`);
const three = (n) => [Math.floor(n / 100) ? `${ONES[Math.floor(n / 100)]} Hundred` : '', n % 100 ? two(n % 100) : ''].filter(Boolean).join(' ');

/**
 * Converts a numeric amount to Indian currency words
 * Example: 125500 -> "Rupees One Lakh Twenty Five Thousand Five Hundred Only"
 * @param {number|string} amount 
 * @returns {string}
 */
export function amountInWords(amount) {
  const value = Math.round(Math.abs(Number(amount) || 0) * 100) / 100;
  let rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

  const parts = [];
  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;

  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;

  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;

  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rupees) parts.push(three(rupees));

  let words = parts.length ? `Rupees ${parts.join(' ')}` : 'Rupees Zero';
  if (paise) words += ` and ${two(paise)} Paise`;

  return `${words} Only`;
}

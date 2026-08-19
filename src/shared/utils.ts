export const generateUserCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let code = '';

  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return `FCVN_${code}`;
};

export function generatePurchaseCode(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();

  return `PO-${datePart}${randomPart}`;
}

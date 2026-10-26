import { ShowroomSettings } from '../models/ShowroomSettings.js';

/**
 * Generate a sequential, unique invoice number based on showroom settings
 * @returns {Promise<string>}
 */
export async function getNextInvoiceNumber() {
  let settings = await ShowroomSettings.findOne();
  if (!settings) {
    settings = await ShowroomSettings.create({
      invoicePrefix: 'HND-2026',
      nextInvoiceNumber: 1001,
    });
  }

  const currentNumber = settings.nextInvoiceNumber || 1001;
  const prefix = settings.invoicePrefix || 'HND-2026';
  const invoiceNumber = `${prefix}-${String(currentNumber).padStart(4, '0')}`;

  // Increment nextInvoiceNumber
  settings.nextInvoiceNumber = currentNumber + 1;
  await settings.save();

  return invoiceNumber;
}

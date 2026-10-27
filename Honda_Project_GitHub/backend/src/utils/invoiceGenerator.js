import { ShowroomSettings } from '../models/ShowroomSettings.js';

/**
 * Generate a sequential, unique invoice number based on showroom settings.
 * The counter is incremented atomically ($inc), so two sales saved at the
 * same moment can never receive the same invoice number.
 * @returns {Promise<string>}
 */
export async function getNextInvoiceNumber() {
  let settings = await ShowroomSettings.findOne();
  if (!settings) {
    settings = await ShowroomSettings.create({
      invoicePrefix: 'HND-2026',
      nextInvoiceNumber: 1001,
    });
  } else if (!settings.nextInvoiceNumber) {
    settings.nextInvoiceNumber = 1001;
    await settings.save();
  }

  // Atomically reserve the current number and move the counter forward by one
  const before = await ShowroomSettings.findOneAndUpdate(
    { _id: settings._id },
    { $inc: { nextInvoiceNumber: 1 } },
    { new: false }
  );

  const currentNumber = before?.nextInvoiceNumber || 1001;
  const prefix = before?.invoicePrefix || settings.invoicePrefix || 'HND-2026';
  return `${prefix}-${String(currentNumber).padStart(4, '0')}`;
}

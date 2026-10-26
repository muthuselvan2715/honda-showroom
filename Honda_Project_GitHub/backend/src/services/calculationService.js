/**
 * Financial Calculation Service for Honda Motorcycle Dealership
 * Implements strict Indian motorcycle sales tax breakdown:
 * - Ex-showroom price
 * - Accessories
 * - Discount
 * - Taxable Value = (Ex-Showroom + Accessories - Discount)
 * - GST (Default 28% for two-wheelers, split into 14% CGST + 14% SGST)
 * - Insurance (Statutory charge)
 * - RTO / Road Tax & Registration
 * - On-Road Total = Taxable Value + CGST + SGST + Insurance + RTO
 */

export function roundToTwo(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

export function calculateSaleTotals({
  exShowroomPrice,
  insuranceCharge = 0,
  rtoRegistrationCharge = 0,
  accessoriesList = [],
  discountAmount = 0,
  gstRate = 28,
}) {
  const basePrice = Math.max(0, roundToTwo(exShowroomPrice));
  const insurance = Math.max(0, roundToTwo(insuranceCharge));
  const rto = Math.max(0, roundToTwo(rtoRegistrationCharge));
  const discount = Math.max(0, roundToTwo(discountAmount));

  // Sum accessories
  const accessoriesTotal = accessoriesList.reduce((sum, item) => {
    return sum + Math.max(0, roundToTwo(item.price || 0));
  }, 0);

  // Validation: Discount cannot exceed vehicle base + accessories
  const grossGoods = basePrice + accessoriesTotal;
  const effectiveDiscount = Math.min(discount, grossGoods);

  // Taxable amount subject to GST
  const taxableAmount = roundToTwo(grossGoods - effectiveDiscount);

  // GST Calculation (CGST 50%, SGST 50%)
  const rate = Number(gstRate) || 28;
  const totalTaxAmount = roundToTwo((taxableAmount * rate) / 100);
  const cgstAmount = roundToTwo(totalTaxAmount / 2);
  const sgstAmount = roundToTwo(totalTaxAmount - cgstAmount); // avoids rounding discrepancies

  // Total invoice / on-road total
  const totalAmount = roundToTwo(taxableAmount + totalTaxAmount + insurance + rto);

  return {
    exShowroomPrice: basePrice,
    insuranceCharge: insurance,
    rtoRegistrationCharge: rto,
    accessoriesTotal: roundToTwo(accessoriesTotal),
    discountAmount: effectiveDiscount,
    taxableAmount,
    gstRate: rate,
    cgstAmount,
    sgstAmount,
    totalTaxAmount,
    totalAmount,
  };
}

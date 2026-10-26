import { describe, it, expect } from 'vitest';
import { calculateSaleTotals, roundToTwo } from '../src/services/calculationService.js';
import { amountInWords } from '../src/utils/amountWords.js';

describe('Financial Calculation Service', () => {
  it('correctly calculates taxable value and GST breakdown for Activa 6G', () => {
    const input = {
      exShowroomPrice: 76684,
      insuranceCharge: 5200,
      rtoRegistrationCharge: 7800,
      accessoriesList: [
        { name: 'Chrome Guard', price: 2400 },
        { name: 'Floor Mat', price: 950 },
      ],
      discountAmount: 1500,
      gstRate: 28,
    };

    const result = calculateSaleTotals(input);

    // Accessories: 2400 + 950 = 3350
    expect(result.accessoriesTotal).toBe(3350);

    // Gross Goods: 76684 + 3350 = 80034
    // Taxable: 80034 - 1500 = 78534
    expect(result.taxableAmount).toBe(78534);

    // 28% GST: 78534 * 0.28 = 21989.52
    expect(result.totalTaxAmount).toBe(21989.52);

    // CGST: 10994.76, SGST: 10994.76
    expect(result.cgstAmount).toBe(10994.76);
    expect(result.sgstAmount).toBe(10994.76);
    expect(roundToTwo(result.cgstAmount + result.sgstAmount)).toBe(result.totalTaxAmount);

    // On-Road Total: 78534 + 21989.52 + 5200 + 7800 = 113523.52
    expect(result.totalAmount).toBe(113523.52);
  });

  it('caps discount if discount exceeds vehicle base + accessories', () => {
    const input = {
      exShowroomPrice: 10000,
      accessoriesList: [{ name: 'Sticker', price: 500 }],
      discountAmount: 15000, // Excessive discount
      gstRate: 28,
    };

    const result = calculateSaleTotals(input);
    expect(result.discountAmount).toBe(10500);
    expect(result.taxableAmount).toBe(0);
    expect(result.totalTaxAmount).toBe(0);
  });

  it('handles zero discount, zero accessories without rounding errors', () => {
    const input = {
      exShowroomPrice: 84800,
      insuranceCharge: 6000,
      rtoRegistrationCharge: 8000,
      accessoriesList: [],
      discountAmount: 0,
      gstRate: 28,
    };

    const result = calculateSaleTotals(input);
    expect(result.taxableAmount).toBe(84800);
    expect(result.totalTaxAmount).toBe(roundToTwo(84800 * 0.28));
    expect(result.totalAmount).toBe(roundToTwo(84800 + 84800 * 0.28 + 6000 + 8000));
  });

  it('prevents negative values in calculations', () => {
    const input = {
      exShowroomPrice: -5000,
      insuranceCharge: -100,
      discountAmount: -500,
    };

    const result = calculateSaleTotals(input);
    expect(result.exShowroomPrice).toBe(0);
    expect(result.insuranceCharge).toBe(0);
    expect(result.discountAmount).toBe(0);
  });
});

describe('Indian Currency In Words (amountInWords)', () => {
  it('converts exact thousands and hundreds properly', () => {
    expect(amountInWords(1000)).toBe('Rupees One Thousand Only');
    expect(amountInWords(25500)).toBe('Rupees Twenty Five Thousand Five Hundred Only');
  });

  it('converts lakhs accurately', () => {
    expect(amountInWords(125500)).toBe('Rupees One Lakh Twenty Five Thousand Five Hundred Only');
    expect(amountInWords(214856)).toBe('Rupees Two Lakh Fourteen Thousand Eight Hundred Fifty Six Only');
  });

  it('handles zero correctly', () => {
    expect(amountInWords(0)).toBe('Rupees Zero Only');
  });

  it('handles paise fractions correctly', () => {
    expect(amountInWords(100.50)).toBe('Rupees One Hundred and Fifty Paise Only');
  });
});

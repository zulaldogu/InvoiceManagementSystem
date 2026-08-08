export type InvoiceCalculationInput = {
  Quantity: number;
  Price: number;
  VatRate: number;
  ExciseTaxRate: number;
};

export type InvoiceLineAmounts = {
  Subtotal: number;
  VatAmount: number;
  ExciseTaxAmount: number;
  LineTotal: number;
};

export type InvoiceTotals = {
  Subtotal: number;
  VatTotal: number;
  ExciseTaxTotal: number;
  TotalAmount: number;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function calculateInvoiceLineAmounts(
  line: InvoiceCalculationInput,
): InvoiceLineAmounts {
  const quantity = validNumber(line.Quantity);
  const price = validNumber(line.Price);
  const vatRate = validNumber(line.VatRate);
  const exciseTaxRate = validNumber(line.ExciseTaxRate);

  const subtotal = roundMoney(quantity * price);
  const exciseTaxAmount = roundMoney(
    (subtotal * exciseTaxRate) / 100,
  );
  const vatAmount = roundMoney(
    ((subtotal + exciseTaxAmount) * vatRate) / 100,
  );
  const lineTotal = roundMoney(
    subtotal + exciseTaxAmount + vatAmount,
  );

  return {
    Subtotal: subtotal,
    VatAmount: vatAmount,
    ExciseTaxAmount: exciseTaxAmount,
    LineTotal: lineTotal,
  };
}

export function calculateInvoiceTotals(
  lines: InvoiceLineAmounts[],
): InvoiceTotals {
  return lines.reduce<InvoiceTotals>(
    (totals, line) => ({
      Subtotal: roundMoney(
        totals.Subtotal + line.Subtotal,
      ),
      VatTotal: roundMoney(
        totals.VatTotal + line.VatAmount,
      ),
      ExciseTaxTotal: roundMoney(
        totals.ExciseTaxTotal + line.ExciseTaxAmount,
      ),
      TotalAmount: roundMoney(
        totals.TotalAmount + line.LineTotal,
      ),
    }),
    {
      Subtotal: 0,
      VatTotal: 0,
      ExciseTaxTotal: 0,
      TotalAmount: 0,
    },
  );
}
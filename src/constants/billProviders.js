export const BILL_PROVIDERS = [{ id: 'meralco', name: 'Meralco', logo: '/meralco-logo.webp' }, { id: 'maynilad', name: 'Maynilad', logo: '/maynilad-logo.png' }, { id: 'pldt', name: 'PLDT', logo: '/pldt-logo.png' }, { id: 'tala', name: 'TALA', logo: '/tala-logo.svg' }, { id: 'shopeepay', name: 'ShopeePay', logo: '/shopeepay-logo.png' }]
export function providerFor(bill) {
  return bill.provider === 'other' ? undefined : BILL_PROVIDERS.find(p => p.id === bill.provider || (!bill.provider && bill.name.toLowerCase().replace(/\s/g, '').includes(p.id)))
}

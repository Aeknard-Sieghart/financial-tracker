import { providerFor } from '../constants/billProviders'
export default function BillProviderIcon({ bill }) {
  const provider = providerFor(bill)
  return <span className={`bill-provider-icon ${provider?.id || 'generic'}`} title={provider?.name || bill.category}>
    {provider?.logo ? <img src={provider.logo} alt={provider.name} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{provider?.id === 'maynilad' ? <><path d="M12 2s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13Z" /><path d="m8 16 2-4 2 3 2-3 2 4" /></> : <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6" /></>}</svg>}
  </span>
}

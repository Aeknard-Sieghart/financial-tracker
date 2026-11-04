// Bank-inspired presentation, independent of account balances and saved data.
export const BANK_THEMES = [
  { name: 'BDO', color: '#003b71', accent: '#f5b335', pattern: 'bands', logo: '/bdo-logo.svg' },
  { name: 'BPI', color: '#a6192e', accent: '#d7bb79', pattern: 'rings', logo: '/bpi-logo.svg' },
  { name: 'Metrobank', color: '#003c8f', accent: '#79b9ee', pattern: 'bands', logo: '/metrobank-logo.svg' },
  { name: 'Landbank', color: '#006b3f', accent: '#e0c66a', pattern: 'rings', logo: '/landbank-logo.svg' },
  { name: 'Philippine National Bank', aliases: ['PNB'], color: '#003876', accent: '#df555b', pattern: 'bands', logo: '/pnb-logo.jpg' },
  { name: 'RCBC', color: '#004a91', accent: '#8cbedf', pattern: 'arcs', logo: '/rcbc-logo.png' },
  { name: 'Security Bank', color: '#00563f', accent: '#78b8a2', pattern: 'bands', logo: '/security_bank-logo.svg' },
  { name: 'UnionBank', color: '#b74700', accent: '#ffb36b', pattern: 'arcs', logo: '/unionbank-logo.svg' },
  { name: 'China Bank', color: '#ad1f2d', accent: '#eec4ba', pattern: 'bands', logo: '/china_bank-logo.svg' },
  { name: 'EastWest', color: '#55306f', accent: '#cfb05b', pattern: 'arcs', logo: '/eastwest-logo.png', logoSurface: '#55306f' },
  { name: 'PSBank', color: '#004383', accent: '#eb5c62', pattern: 'bands', logo: '/psbank-logo.png', logoSurface: '#004383' },
  { name: 'Maya Bank', color: '#102b20', accent: '#56db84', pattern: 'arcs', logo: '/maya-logo.svg' },
  { name: 'GoTyme Bank', color: '#103f49', accent: '#62d6d1', pattern: 'rings', logo: '/gotyme-logo.svg', logoSurface: '#103f49' },
  { name: 'MariBank', color: '#c94e00', accent: '#6aa3ee', pattern: 'rings', logo: '/maribank-logo.png' },
  { name: 'SeaBank', color: '#bf4c00', accent: '#7db5f0', pattern: 'arcs', logo: '/seabank-logo.webp' },
  { name: 'CIMB Bank', color: '#9e192b', accent: '#e28c9a', pattern: 'bands', logo: '/cimb-logo.svg', logoSurface: '#9e192b' },
  { name: 'Tonik', color: '#4b287f', accent: '#c1a1f1', pattern: 'rings', logo: '/tonik-logo.svg' },
]

const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/bank$/, '')
export function bankTheme(account) {
  if (account.type !== 'bank') return undefined
  const value = normalize(account.bank || account.name)
  return BANK_THEMES.find(theme => value === normalize(theme.name) || theme.aliases?.some(alias => value === normalize(alias)))
}

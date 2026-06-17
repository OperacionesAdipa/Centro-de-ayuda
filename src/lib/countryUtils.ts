export const COUNTRY_DOMAIN: Record<string, string> = {
  Chile: 'cl',
  México: 'mx',
  Colombia: 'co',
  Argentina: 'ar',
}

export const COUNTRY_EMAIL: Record<string, string> = {
  Chile: 'sac@adipa.cl',
  México: 'sac@adipa.mx',
  Colombia: 'sac@adipa.co',
  Argentina: 'sac@adipa.ar',
}

export const COUNTRY_WHATSAPP: Record<string, string> = {
  Chile: 'https://api.whatsapp.com/send?phone=+56957253424&text=Hola,%20me%20quiero%20contactar%20desde%20ADIPA',
  México: 'https://api.whatsapp.com/send?phone=+5216221458968&text=Hola,%20me%20quiero%20contactar%20desde%20ADIPA',
  Colombia: 'https://api.whatsapp.com/send?phone=+573144718655&text=Hola,%20me%20quiero%20contactar%20desde%20ADIPA',
  Argentina: 'https://api.whatsapp.com/send?phone=+56957253424&text=Hola,%20me%20quiero%20contactar%20desde%20ADIPA',
}

export function replaceAdipaLinks(html: string, country: string): string {
  const tld = COUNTRY_DOMAIN[country] ?? 'cl'
  return html.replace(
    /(https?:\/\/)?(www\.)?adipa\.(cl|mx|co|ar)/gi,
    (match, protocol, www) => {
      const prefix = protocol ?? ''
      const wwwPart = www ?? ''
      return `${prefix}${wwwPart}adipa.${tld}`
    }
  )
}

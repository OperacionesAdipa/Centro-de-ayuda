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

export const AVAILABLE_COUNTRIES = ['Chile', 'México', 'Colombia']

// Chile tiene horario de verano entre septiembre y abril (UTC-3)
// y horario de invierno entre mayo y agosto (UTC-4)
function isChileSummer(): boolean {
  const month = new Date().getMonth() + 1
  return month >= 9 || month <= 4
}

export function getCountryHours(country: string): string {
  const summer = isChileSummer()

  const hours: Record<string, string> = {
    Chile: 'Lun-Mie 09:00-18:00 · Jue 09:00-17:00 · Vie 09:00-16:00 · Sáb 09:00-14:00',
    México: summer
      ? 'Lun-Mie 06:00-15:00 · Jue 06:00-14:00 · Vie 06:00-13:00 · Sáb 06:00-11:00'
      : 'Lun-Mie 07:00-16:00 · Jue 07:00-15:00 · Vie 07:00-14:00 · Sáb 07:00-12:00',
    Colombia: summer
      ? 'Lun-Mie 07:00-16:00 · Jue 07:00-15:00 · Vie 07:00-14:00 · Sáb 07:00-12:00'
      : 'Lun-Mie 08:00-17:00 · Jue 08:00-16:00 · Vie 08:00-15:00 · Sáb 08:00-13:00',
    Argentina: summer
      ? 'Lun-Mie 09:00-18:00 · Jue 09:00-17:00 · Vie 09:00-16:00 · Sáb 09:00-14:00'
      : 'Lun-Mie 10:00-19:00 · Jue 10:00-18:00 · Vie 10:00-17:00 · Sáb 10:00-15:00',
  }

  return hours[country] ?? hours['Chile']
}

// Mantener COUNTRY_HOURS para compatibilidad
export const COUNTRY_HOURS: Record<string, string> = {
  Chile: 'Lun-Mie 09:00-18:00 · Jue 09:00-17:00 · Vie 09:00-16:00 · Sáb 09:00-14:00',
  México: 'Lun-Mie 06:00-15:00 · Jue 06:00-14:00 · Vie 06:00-13:00 · Sáb 06:00-11:00',
  Colombia: 'Lun-Mie 07:00-16:00 · Jue 07:00-15:00 · Vie 07:00-14:00 · Sáb 07:00-12:00',
  Argentina: 'Lun-Mie 09:00-18:00 · Jue 09:00-17:00 · Vie 09:00-16:00 · Sáb 09:00-14:00',
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

export function replaceMexicoTerms(text: string, country: string): string {
  if (country !== 'México') return text
  return text
    .replace(/certificaciones/gi, 'constancias')
    .replace(/certificación/gi, 'constancia')
    .replace(/certificados/gi, 'constancias')
    .replace(/certificado/gi, 'constancia')
}

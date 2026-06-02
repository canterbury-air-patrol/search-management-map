import Cookies, { CookieSetOptions } from 'universal-cookie'

const cookieJar = new Cookies(null, { path: '/', sameSite: 'strict' })

/** Long-lived (~1 year) cookie options for storing UI preferences such
 *  as layer toggles and per-asset track colours. Don't apply to cookies
 *  whose lifetime should be governed by the server (e.g. csrftoken). */
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60
export const PREFERENCE_COOKIE_OPTS: CookieSetOptions = { maxAge: ONE_YEAR_SECONDS }

export { cookieJar }

import Cookies from 'universal-cookie'

const cookieJar = new Cookies(null, { path: '/', maxAge: 31536000, sameSite: 'strict' })

export { cookieJar }

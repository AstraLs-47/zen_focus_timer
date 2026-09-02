import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/backgrounds') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPublicPage = pathname === '/' || isAuthPage || pathname.startsWith('/auth')

  if (isPublicPage) {
    return NextResponse.next()
  }

  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some(
    c => (c.name.includes('auth-token') || c.name.startsWith('sb-') || c.name.startsWith('sb:')) && c.value
  )

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const middleware = proxy
export default proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|backgrounds|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

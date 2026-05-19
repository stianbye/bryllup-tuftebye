/**
 * TufteBye AI — bryllup.tuftebyeai.com
 * Cloudflare Pages Function Middleware
 *
 * Sjekker crm_sess-cookie (satt av dashboard.tuftebyeai.com/login.html
 * med domain=.tuftebyeai.com, deles på tvers av alle subdomener).
 * Uautentiserte brukere sendes til login-siden på dashboard.
 */
export async function onRequest({ request, next }) {
  const url  = new URL(request.url);
  const path = url.pathname;

  // Ikke beskyttet: CF interne stier, statiske assets
  if (
    path.startsWith('/_') ||
    path.startsWith('/cdn-cgi/') ||
    path === '/favicon.ico'
  ) {
    return next();
  }

  // Sjekk sesjonskookie (satt av login.html med domain=.tuftebyeai.com)
  const cookies = request.headers.get('Cookie') || '';
  const hasSess = cookies.split(';').some(c => c.trim().startsWith('crm_sess=1'));

  if (!hasSess) {
    const fullUrl = encodeURIComponent(url.href);
    return Response.redirect(
      `https://dashboard.tuftebyeai.com/login.html?redirect=${fullUrl}`,
      302
    );
  }

  return next();
}

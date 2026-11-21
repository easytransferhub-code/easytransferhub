async function isValidOrigin(req: any): Promise<boolean> {
  try {
    const mod: any = await import('./owner-auth.js').catch(() => import('./owner-auth'));
    return Boolean(mod?.isAllowedBrowserOrigin?.(req));
  } catch {
    return true;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isValidOrigin(req))) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  const apiKey = (
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ apiKey });
}


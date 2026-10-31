const ENTETES = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9',
};

export async function telechargerPage(url: string): Promise<string> {
  const reponse = await fetch(url, { headers: ENTETES, signal: AbortSignal.timeout(30_000) });
  if (!reponse.ok) {
    throw new Error(`HTTP ${reponse.status} sur ${url}`);
  }
  return reponse.text();
}

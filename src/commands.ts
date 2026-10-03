export type Command = 'claim' | 'unclaim';

export function parseCommand(body: string): Command | null {
  const first = body.trim().split(/\s+/)[0]?.toLowerCase();
  if (first === '/claim') return 'claim';
  if (first === '/unclaim') return 'unclaim';
  return null;
}

import { useMatches, type UIMatch } from 'react-router-dom';

export interface RouteHandle {
  title?: string;
  back?: boolean;
  noScroll?: boolean;
  profile?: boolean;
}

export function useRouteHandle() {
  const matches = useMatches() as UIMatch<unknown, RouteHandle>[];
  const last = matches[matches.length - 1];
  return [last?.handle ?? {}, last] as const;
}

import { createContext, useContext } from 'react';

export interface WhitelistCtxValue {
  open: () => void;
  openChecker: () => void;
}

export const WhitelistCtx = createContext<WhitelistCtxValue>({
  open: () => {},
  openChecker: () => {},
});

export const useWhitelist = () => useContext(WhitelistCtx);

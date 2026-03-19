import React, { createContext, useContext, useEffect, useState } from 'react';

const ZafContext = createContext(null);

export function ZafProvider({ children }) {
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (window.ZAFClient) {
      const zafClient = window.ZAFClient.init();
      zafClient.invoke('resize', { width: '100%', height: '600px' });
      setClient(zafClient);
    }
  }, []);

  return <ZafContext.Provider value={client}>{children}</ZafContext.Provider>;
}

export function useZafClient() {
  return useContext(ZafContext);
}

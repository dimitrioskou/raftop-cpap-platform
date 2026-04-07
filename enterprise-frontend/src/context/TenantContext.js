import React, { createContext, useContext, useMemo, useState } from 'react';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState({
    id: 'tenant-demo',
    name: 'RAFTOP Enterprise',
    plan: 'premium',
    organization: 'RAFTOP CPAP CARE'
  });

  const value = useMemo(
    () => ({
      tenant,
      setTenant
    }),
    [tenant]
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    return {
      tenant: {
        id: 'tenant-demo',
        name: 'RAFTOP Enterprise',
        plan: 'premium',
        organization: 'RAFTOP CPAP CARE'
      },
      setTenant: () => {}
    };
  }

  return context;
}
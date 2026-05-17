type GraphManager = {
  id: string;
  mail?: string;
  displayName?: string;
};

// ---------------------------------------------------------------------------
// Token management — uses client credentials flow with auto-refresh
// No more static MS_GRAPH_ACCESS_TOKEN that expires after 1 hour.
// The @azure/identity SDK caches and auto-renews tokens internally.
// ---------------------------------------------------------------------------

export async function getGraphAccessToken(): Promise<string | null> {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) return null;

  try {
    // Dynamic import to avoid bundling @azure/identity in Edge middleware
    const { ClientSecretCredential } = await import("@azure/identity");
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");
    return tokenResponse?.token ?? null;
  } catch (error) {
    console.warn("Failed to acquire Graph access token:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Manager lookup via /me/manager (delegated — used during Azure AD login)
// ---------------------------------------------------------------------------

export async function fetchManagerFromGraph(accessToken?: string): Promise<GraphManager | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch("https://graph.microsoft.com/v1.0/me/manager", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) return null;

    const manager = (await response.json()) as {
      id: string;
      mail?: string;
      displayName?: string;
    };

    return manager;
  } catch {
    return null;
  }
}

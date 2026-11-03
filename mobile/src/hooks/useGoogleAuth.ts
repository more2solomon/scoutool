import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useCallback, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'scoutmail',
      }),
      scopes: ['openid', 'email', 'https://www.googleapis.com/auth/gmail.compose'],
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
    DISCOVERY
  );

  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await promptAsync();
      
      if (result.type === 'success') {
        // The code will be sent to your backend for token exchange
        // For now, we'll just return the auth code
        return { success: true, code: result.params.code };
      } else if (result.type === 'error') {
        setError(result.error || 'Authentication failed');
        return { success: false, error: result.error };
      } else {
        setError('Authentication was cancelled');
        return { success: false, error: 'Cancelled' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [promptAsync]);

  return {
    signIn,
    loading,
    error,
    request,
  };
}

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { apiRequest } from './queryClient';
import { z } from 'zod';

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const authInitSchema = z.object({
  options: z.any(),
});

/**
 * Check if biometric authentication is available on the current device
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    // Check if PublicKeyCredential is available (WebAuthn)
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false;
    }

    // Check if platform authenticator (TouchID, FaceID) is available
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
}

/**
 * Register a new biometric credential (TouchID, FaceID, Windows Hello)
 */
export async function registerBiometric(username: string): Promise<boolean> {
  try {
    // First, get registration options from server
    const initResponse = await apiRequest('POST', '/api/webauthn/register-init', { username });
    
    if (!initResponse.ok) {
      throw new Error('Failed to initialize biometric registration');
    }
    
    const initData = await initResponse.json();
    const parsedData = authInitSchema.parse(initData);
    
    // Start the registration process in the browser
    const registrationResponse = await startRegistration(parsedData.options);
    
    // Send the response back to the server for verification
    const verifyResponse = await apiRequest('POST', '/api/webauthn/register-verify', {
      registrationResponse,
      username,
    });
    
    if (!verifyResponse.ok) {
      throw new Error('Failed to verify biometric registration');
    }
    
    const verifyData = await verifyResponse.json();
    const parsedVerifyData = responseSchema.parse(verifyData);
    
    return parsedVerifyData.success;
  } catch (error) {
    console.error('Error during biometric registration:', error);
    return false;
  }
}

/**
 * Authenticate using biometric credential (TouchID, FaceID, Windows Hello)
 */
export async function loginWithBiometric(username: string): Promise<boolean> {
  try {
    // First, get authentication options from server
    const initResponse = await apiRequest('POST', '/api/webauthn/login-init', { username });
    
    if (!initResponse.ok) {
      throw new Error('Failed to initialize biometric authentication');
    }
    
    const initData = await initResponse.json();
    const parsedData = authInitSchema.parse(initData);
    
    // Start the authentication process in the browser
    const authenticationResponse = await startAuthentication(parsedData.options);
    
    // Send the response back to the server for verification
    const verifyResponse = await apiRequest('POST', '/api/webauthn/login-verify', {
      authenticationResponse,
      username,
    });
    
    if (!verifyResponse.ok) {
      throw new Error('Failed to verify biometric authentication');
    }
    
    const verifyData = await verifyResponse.json();
    const parsedVerifyData = responseSchema.parse(verifyData);
    
    return parsedVerifyData.success;
  } catch (error) {
    console.error('Error during biometric authentication:', error);
    return false;
  }
}

/**
 * Generate and save a remember me token
 */
export async function setRememberMe(username: string): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/remember-token', { username });
    
    if (!response.ok) {
      throw new Error('Failed to set remember me token');
    }
    
    const data = await response.json();
    const parsedData = responseSchema.parse(data);
    
    // Store the token in local storage if successful
    if (parsedData.success) {
      localStorage.setItem('stonewhistle_remembered_user', username);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error setting remember me token:', error);
    return false;
  }
}

/**
 * Check if a user is remembered and try to log them in automatically
 */
export async function checkRememberedUser(): Promise<{ success: boolean, username?: string }> {
  try {
    const rememberedUser = localStorage.getItem('stonewhistle_remembered_user');
    
    if (!rememberedUser) {
      return { success: false };
    }
    
    const response = await apiRequest('POST', '/api/login-with-token', {
      username: rememberedUser,
    });
    
    if (!response.ok) {
      // Token is invalid or expired, clear it
      localStorage.removeItem('stonewhistle_remembered_user');
      return { success: false };
    }
    
    return { success: true, username: rememberedUser };
  } catch (error) {
    console.error('Error checking remembered user:', error);
    return { success: false };
  }
}

/**
 * Clear the remember me token
 */
export function clearRememberMe(): void {
  localStorage.removeItem('stonewhistle_remembered_user');
}
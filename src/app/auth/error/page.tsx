'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'An unknown authentication error occurred.';
  let errorDetails = '';

  if (error === 'OAuthAccountNotLinked') {
    errorMessage = 'Email Already in Use';
    errorDetails = 'This email is already registered with another sign-in method. Please use your existing account or a different email.';
  } else if (error === 'OAuthSignin') {
    errorMessage = 'OAuth Sign-in Error';
    errorDetails = 'There was an error signing in with the OAuth provider. Please try again.';
  } else if (error === 'OAuthCallback') {
    errorMessage = 'OAuth Callback Error';
    errorDetails = 'There was an error during the OAuth callback. Please try again.';
  } else if (error === 'OAuthCreateAccount') {
    errorMessage = 'Account Creation Error';
    errorDetails = 'There was an error creating your account. Please try again.';
  } else if (error === 'EmailCreateAccount') {
    errorMessage = 'Email Account Creation Error';
    errorDetails = 'There was an error creating your email account. Please try again.';
  } else if (error === 'Callback') {
    errorMessage = 'Callback Error';
    errorDetails = 'There was an error during authentication callback. Please try again.';
  } else if (error === 'OAuthAccountNotLinked') {
    errorMessage = 'Account Not Linked';
    errorDetails = 'This email is already associated with another account. Please sign in with your original method.';
  } else if (error === 'EmailSignin') {
    errorMessage = 'Email Sign-in Error';
    errorDetails = 'There was an error sending the sign-in email. Please try again.';
  } else if (error === 'CredentialsSignin') {
    errorMessage = 'Invalid Credentials';
    errorDetails = 'The credentials you provided are invalid. Please check and try again.';
  } else if (error === 'SessionRequired') {
    errorMessage = 'Session Required';
    errorDetails = 'You must be signed in to access this page.';
  } else if (error === 'Default') {
    errorMessage = 'Authentication Error';
    errorDetails = 'An error occurred during authentication. Please try again.';
  } else if (error) {
    errorMessage = 'Authentication Error';
    errorDetails = `Error: ${error}`;
  }

  return (
    <main style={{
      padding: 24,
      maxWidth: 600,
      margin: '0 auto',
      textAlign: 'center',
      paddingTop: 80
    }}>
      <h1 style={{ color: '#d32f2f', marginBottom: 16 }}>
        {errorMessage}
      </h1>
      <p style={{ fontSize: 16, marginBottom: 24, color: '#666' }}>
        {errorDetails}
      </p>
      <p style={{ marginBottom: 24 }}>
        Please try again or contact support if the problem persists.
      </p>
      <Link
        href="/auth/signin"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#1976d2',
          color: 'white',
          textDecoration: 'none',
          borderRadius: 4,
          fontWeight: 500
        }}
      >
        Back to Sign In
      </Link>
    </main>
  );
}

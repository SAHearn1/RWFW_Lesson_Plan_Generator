// File: src/components/SignIn.tsx

'use client';

import React, { useEffect } from 'react';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase'; // We will create this file next
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

const SignIn = () => {
  useEffect(() => {
    // Ensure we only initialize FirebaseUI once
    if (document.getElementById('firebaseui-auth-container')?.childElementCount === 0) {
      const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
      
      const uiConfig = {
        signInSuccessUrl: '/', // Redirect to home page after sign in
        signInOptions: [
          // Add the sign-in methods you want to support
          GoogleAuthProvider.PROVIDER_ID,
          EmailAuthProvider.PROVIDER_ID,
        ],
        // Other config options...
      };
      
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Sign In / Sign Up</h2>
        <p className="mb-6 text-slate-600">Please sign in to use the Lesson Plan Generator.</p>
        <div id="firebaseui-auth-container"></div>
    </div>
  );
};

export default SignIn;

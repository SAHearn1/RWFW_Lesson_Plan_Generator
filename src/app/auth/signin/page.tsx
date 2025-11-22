// 'use client'

import Image from 'next/image';
import { FormEvent } from 'react';

const SignInPage = () => {
  const handleGoogleSignIn = async () => {
    console.log('Google sign-in clicked');
    alert('Google sign-in will be connected to Firebase authentication.');
    setIsGoogleLoading(false);
  };

  return (
    <div className="hero-section">
      <Image src="/path/to/logo.png" alt="Root Work Framework Logo" />
      <h1>Welcome to Root Work Framework</h1>
      <p>Your description here...</p>
      <div className="tabs">
        <button onClick={() => setActiveTab('signin')}>Sign In</button>
        <button onClick={() => setActiveTab('signup')}>Sign Up</button>
      </div>
      <div className="form-container">
        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Password" required />
            <div className="remember-me">
              <input type="checkbox" id="remember-me" />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            <button type="button" onClick={handleGoogleSignIn}>Sign in with Google</button>
            <button type="button">Sign in with Facebook</button>
            <button type="submit">Sign In</button>
            <a href="#">Forgot Password?</a>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Password" required />
            <button type="submit">Sign Up</button>
          </form>
        )}
      </div>
      <div className="terms">
        <input type="checkbox" required />
        <label>I agree to the <a href="#">terms of service</a></label>
      </div>
    </div>
  );
};

export default SignInPage;
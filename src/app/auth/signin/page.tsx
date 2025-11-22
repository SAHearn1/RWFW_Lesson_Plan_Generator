import React from 'react';
import { GoogleButton, FacebookButton } from './SocialButtons';
// TODO: Replace this placeholder with actual signIn import
// Placeholder implementation
const SignInPage = () => {
    return (
        <div className="signin-page">
            <h1>Sign In</h1>
            <form>
                <input type="email" placeholder="Email" required />
                <input type="password" placeholder="Password" required />
                <button type="submit">Sign In</button>
            </form>
            <GoogleButton />
            <FacebookButton />
        </div>
    );
};

export default SignInPage;
'use client'

import { useState } from "react";
import { signup, login } from "./actions";

export default function LoginPage() {
  const [isSigningUp, setIsSigningUp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center gym-gradient-bg p-4">
      <div className="w-full max-w-md perspective-distant">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto size-20 bg-primary rounded-full flex items-center justify-center mb-4 
                         transform-3d rotate-y-6 hover:rotate-y-12 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-12 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">FitTrack Pro</h1>
          <p className="text-gray-400">Your ultimate fitness companion</p>
        </div>
        
        {/* Login/Signup Form */}
        <div className="glass-card transform-3d hover:rotate-x-1 transition-transform">
          <h2 className="text-2xl font-semibold text-white mb-6">
            {isSigningUp ? "Create Account" : "Welcome Back"}
          </h2>
          
          <form className="space-y-6">
            {/* Full Name - Only visible when signing up */}
            {isSigningUp && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  required={isSigningUp}
                  className="gym-input"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="gym-input"
                placeholder="your@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="gym-input"
                placeholder="••••••••"
              />
            </div>
            
            {/* Phone - Only visible when signing up */}
            {isSigningUp && (
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone Number</label>
                <input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  className="gym-input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}
            
        
            
            {/* Remember me & Forgot password - Only visible when logging in */}
            {!isSigningUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="size-4 rounded border-gray-500 text-primary focus:ring-primary" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">Remember me</label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary-hover">Forgot password?</a>
                </div>
              </div>
            )}
            
            {/* Accept terms - Only visible when signing up */}
            {isSigningUp && (
              <div className="flex items-center">
                <input 
                  id="terms" 
                  name="terms" 
                  type="checkbox" 
                  required={isSigningUp}
                  className="size-4 rounded border-gray-500 text-primary focus:ring-primary" 
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                  I accept the <a href="#" className="text-primary hover:text-primary-hover">Terms of Service</a> and <a href="#" className="text-primary hover:text-primary-hover">Privacy Policy</a>
                </label>
              </div>
            )}
            
            <div className="space-y-3">
              {isSigningUp ? (
                <>
                  <button 
                    formAction={signup} 
                    className="gym-btn-primary w-full"
                  >
                    Create Account
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsSigningUp(false)} 
                    className="gym-btn-secondary w-full text-white"
                  >
                    Already have an account? Log in
                  </button>
                </>
              ) : (
                <>
                  <button 
                    formAction={login} 
                    className="gym-btn-primary w-full"
                  >
                    Log in
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsSigningUp(true)} 
                    className="gym-btn-secondary w-full text-white"
                  >
                    Create an account
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
        
        {/* Footer - Only visible when not signing up */}
        {!isSigningUp && (
          <p className="mt-8 text-center text-sm text-gray-400">
            By continuing, you agree to our <a href="#" className="text-primary hover:text-primary-hover">Terms of Service</a> and <a href="#" className="text-primary hover:text-primary-hover">Privacy Policy</a>
          </p>
        )}
      </div>
    </div>
  );
}
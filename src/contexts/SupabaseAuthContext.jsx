import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Extended user data from app_users
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile data from app_users
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      // Fetch extended profile info (role, assigned_class, etc.)
      let userProfile = await fetchProfile(currentUser.id);
      
      // Fallback for demo/admin if not found
      if (!userProfile && currentUser.email === '3762437@gmail.com') {
         userProfile = { id: currentUser.id, role: 'principal', name: 'System Admin' };
      } else if (!userProfile) {
         // Default fallback to prevent crashes if DB record missing
         userProfile = { id: currentUser.id, role: 'teacher', name: currentUser.user_metadata?.name || 'User' };
      }
      
      setProfile(userProfile);
    } else {
      setProfile(null);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
    };
    initAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
           setProfile(null);
           setUser(null);
           setSession(null);
           setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
           await handleSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    if (error) {
      toast({ variant: "destructive", title: "Sign up Failed", description: error.message });
    }
    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast({ variant: "destructive", title: "Sign in Failed", description: error.message });
    }
    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Sign out Failed", description: error.message });
    }
    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    profile, // Export the extended profile
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, profile, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
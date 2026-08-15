import { createClient } from '@/lib/supabase/client';
import {
    LoginCredentials,
    RegisterData,
    AuthResponse,
    User,
    UpdateUserRequest,
    ChangePasswordRequest,
} from '@/types/auth';

function mapProfileToUser(
    authUser: { id: string; email?: string | null; email_confirmed_at?: string | null; created_at?: string },
    profile?: {
        first_name?: string | null;
        last_name?: string | null;
        phone?: string | null;
        avatar_url?: string | null;
        created_at?: string;
        updated_at?: string;
    } | null
): User {
    return {
        id: authUser.id,
        email: authUser.email || '',
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        phone: profile?.phone || undefined,
        avatar: profile?.avatar_url || undefined,
        isEmailVerified: !!authUser.email_confirmed_at,
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at,
    };
}

async function fetchProfile(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    return data;
}

async function buildAuthResponse(
    authUser: { id: string; email?: string | null; email_confirmed_at?: string | null; created_at?: string },
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
): Promise<AuthResponse> {
    const profile = await fetchProfile(authUser.id);
    return {
        user: mapProfileToUser(authUser, profile),
        accessToken,
        refreshToken,
        expiresIn,
    };
}

/**
 * Authentication Service — Supabase Auth
 */
export class AuthService {
    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        if (error) {
            throw new Error(error.message);
        }
        if (!data.session || !data.user) {
            throw new Error('Invalid login response');
        }

        return buildAuthResponse(
            data.user,
            data.session.access_token,
            data.session.refresh_token,
            data.session.expires_in
        );
    }

    static async register(userData: RegisterData): Promise<AuthResponse> {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    first_name: userData.firstName || '',
                    last_name: userData.lastName || '',
                },
            },
        });

        if (error) {
            throw new Error(error.message);
        }
        if (!data.user) {
            throw new Error('Invalid registration response');
        }

        // Email confirmation may leave session null
        if (!data.session) {
            return {
                user: mapProfileToUser(data.user, {
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                }),
                accessToken: '',
                refreshToken: undefined,
                expiresIn: undefined,
            };
        }

        return buildAuthResponse(
            data.user,
            data.session.access_token,
            data.session.refresh_token,
            data.session.expires_in
        );
    }

    static async logout(): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.warn('Logout request failed:', error);
        }
    }

    static async refreshToken(): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
        const supabase = createClient();
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
            throw new Error(error?.message || 'Token refresh failed');
        }
        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
        };
    }

    static async getCurrentUser(): Promise<User> {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            throw new Error(error?.message || 'Not authenticated');
        }
        const profile = await fetchProfile(user.id);
        return mapProfileToUser(user, profile);
    }

    static async updateProfile(userData: UpdateUserRequest): Promise<User> {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            throw new Error(userError?.message || 'Not authenticated');
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({
                first_name: userData.first_name,
                last_name: userData.last_name,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select('*')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return mapProfileToUser(user, data);
    }

    static async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
        const supabase = createClient();
        // Re-authenticate with current password
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            throw new Error('Not authenticated');
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: passwordData.current_password,
        });
        if (signInError) {
            throw new Error('Current password is incorrect');
        }

        const { error } = await supabase.auth.updateUser({
            password: passwordData.new_password,
        });
        if (error) {
            throw new Error(error.message);
        }
    }

    static async forgotPassword(email: string): Promise<void> {
        const supabase = createClient();
        const redirectTo = typeof window !== 'undefined'
            ? `${window.location.origin}/reset-password`
            : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });
        if (error) {
            throw new Error(error.message);
        }
    }

    static async resetPassword(resetData: { password: string }): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            password: resetData.password,
        });
        if (error) {
            throw new Error(error.message);
        }
    }

    static async updateEmail(emailData: { new_email: string }): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            email: emailData.new_email,
        });
        if (error) {
            throw new Error(error.message);
        }
    }

    static async sendEmailVerification(email: string): Promise<void> {
        const supabase = createClient();
        const redirectTo = typeof window !== 'undefined'
            ? `${window.location.origin}/signin`
            : undefined;
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: { emailRedirectTo: redirectTo },
        });
        if (error) {
            throw new Error(error.message);
        }
    }

    static async getSession() {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        return data.session;
    }
}

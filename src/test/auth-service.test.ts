import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock must be defined before imports due to hoisting
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}));

// Import after mock
import { supabase } from '@/lib/supabase';
import * as authService from '@/services/auth-service';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('calls supabase signInWithPassword with correct params', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: 'user-123' } as any, session: {} as any },
        error: null,
      });

      await authService.signIn('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('throws error on invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' } as any,
      });

      await expect(authService.signIn('bad@email.com', 'wrong'))
        .rejects.toThrow('Invalid login credentials');
    });
  });

  describe('signUp', () => {
    it('calls supabase signUp with email and password', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: 'new-user-123' } as any, session: {} as any },
        error: null,
      });

      await authService.signUp('new@example.com', 'password123', 'John Doe');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'John Doe' },
        },
      });
    });

    it('throws error if email already exists', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' } as any,
      });

      await expect(authService.signUp('existing@example.com', 'pass', 'Name'))
        .rejects.toThrow('User already registered');
    });
  });

  describe('signOut', () => {
    it('calls supabase signOut', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('sends password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ 
        data: {}, 
        error: null 
      });

      await authService.resetPassword('user@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(Object)
      );
    });
  });
});

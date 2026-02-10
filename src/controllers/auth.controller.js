import { supabase } from '../services/supabaseClient.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Validate register body: email (required), password (required), fullName (optional).
 * Throws error with statusCode and code for error handler.
 */
function validateRegisterBody(body) {
  const { email, password, fullName } = body || {};
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    err.code = 'MISSING_FIELDS';
    throw err;
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    const err = new Error('Invalid email format');
    err.statusCode = 400;
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    const err = new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    err.statusCode = 400;
    err.code = 'WEAK_PASSWORD';
    throw err;
  }
  return {
    email: trimmedEmail,
    password,
    fullName: typeof fullName === 'string' && fullName.trim() ? fullName.trim() : undefined,
  };
}

/**
 * Validate login body: email (required), password (required).
 */
function validateLoginBody(body) {
  const { email, password } = body || {};
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    err.code = 'MISSING_FIELDS';
    throw err;
  }
  return {
    email: email.trim().toLowerCase(),
    password,
  };
}

/**
 * Build user + session payload for response.
 */
function toAuthData(user, session) {
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? null,
      emailConfirmed: user.email_confirmed_at != null,
    },
    session: session
      ? {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
        }
      : null,
  };
}

/**
 * POST /api/auth/register
 * Accept email + password (fullName optional). Use supabase.auth.signUp().
 */
export async function register(req, res, next) {
  try {
    const payload = validateRegisterBody(req.body);

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: payload.fullName ? { data: { full_name: payload.fullName } } : undefined,
    });

    if (error) {
      const statusCode =
        error.message?.includes('already registered') ||
        error.message?.includes('already exists') ||
        error.code === 'user_already_exists'
          ? 409
          : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Registration failed',
        data: null,
        code: error.code || 'REGISTRATION_ERROR',
      });
    }

    const authData = toAuthData(data.user, data.session);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Check email for confirmation if enabled.',
      data: authData,
    });
  } catch (err) {
    if (err.statusCode) return next(err);
    console.error('Register error:', err);
    return next(err);
  }
}

/**
 * POST /api/auth/login
 * Accept email + password. Use supabase.auth.signInWithPassword().
 * Return access token + user data.
 */
export async function login(req, res, next) {
  try {
    const payload = validateLoginBody(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      const statusCode =
        error.message?.includes('Invalid login') ||
        error.message?.includes('invalid_credentials') ||
        error.code === 'invalid_credentials'
          ? 401
          : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Login failed',
        data: null,
        code: error.code || 'LOGIN_ERROR',
      });
    }

    const authData = toAuthData(data.user, data.session);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: authData,
    });
  } catch (err) {
    if (err.statusCode) return next(err);
    console.error('Login error:', err);
    return next(err);
  }
}

import { parseGraphQLError, getErrorMessage } from './graphqlErrors';

/**
 * Simple error handler that automatically handles common cases
 * Just pass the error and optional callbacks for what you care about
 */
export function handleError(
  error: unknown,
  options?: {
    // Optional: Custom message to show
    message?: string;
    // Optional: What to do on auth error (default: just log)
    onAuthError?: () => void;
    // Optional: What to do on network error (default: just log)
    onNetworkError?: () => void;
    // Optional: Show alert (default: false)
    showAlert?: boolean;
    // Optional: Log to console (default: true in dev)
    log?: boolean;
  }
) {
  const parsed = parseGraphQLError(error);
  const displayMessage = options?.message || parsed.message;

  // Log in development
  if (options?.log !== false && process.env.NODE_ENV === 'development') {
    console.error('Error:', displayMessage, { code: parsed.code, error });
  }

  // Show alert if requested
  if (options?.showAlert) {
    alert(displayMessage);
  }

  // Handle auth errors
  if (parsed.isAuthError && options?.onAuthError) {
    options.onAuthError();
    return parsed;
  }

  // Handle network errors
  if (parsed.isNetworkError && options?.onNetworkError) {
    options.onNetworkError();
    return parsed;
  }

  return parsed;
}

/**
 * Even simpler: Just show the error message
 * Use this for most cases
 */
export function showError(error: unknown, customMessage?: string) {
  const message = customMessage || getErrorMessage(error);
  
  // In development, log the full error
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', message, error);
  }
  
  // Show to user (replace with toast when you add it)
  alert(message);
}

/**
 * Show success message
 */
export function showSuccess(message: string) {
  // Replace with toast when you add it
  alert(message);
}

/**
 * Async wrapper that handles errors automatically
 * Use this to wrap your mutations/queries
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onAuthError?: () => void;
  }
): Promise<T | null> {
  try {
    const result = await fn();
    
    if (options?.successMessage) {
      showSuccess(options.successMessage);
    }
    
    if (options?.onSuccess) {
      options.onSuccess(result);
    }
    
    return result;
  } catch (error) {
    handleError(error, {
      message: options?.errorMessage,
      showAlert: true,
      onAuthError: options?.onAuthError,
    });
    return null;
  }
}

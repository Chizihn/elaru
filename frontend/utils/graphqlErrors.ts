export interface GraphQLErrorExtensions {
  code?: string;
  originalError?: any;
}

export interface ParsedGraphQLError {
  message: string;
  code?: string;
  isAuthError: boolean;
  isValidationError: boolean;
  isNetworkError: boolean;
}

// Apollo Error type definition (compatible with all versions)
interface ApolloErrorLike {
  message?: string;
  graphQLErrors?: Array<{
    message: string;
    extensions?: Record<string, any>;
  }>;
  networkError?: Error | null;
  clientErrors?: Error[];
}

/**
 * Type guard to check if error is an Apollo Error
 */
function isApolloError(error: unknown): error is ApolloErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('graphQLErrors' in error || 'networkError' in error || 'clientErrors' in error)
  );
}

/**
 * Type guard to check if error is a standard Error
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Parse Apollo/GraphQL errors into a user-friendly format
 */
export function parseGraphQLError(error: unknown): ParsedGraphQLError {
  // Handle ApolloError
  if (isApolloError(error)) {
    // Network errors
    if (error.networkError) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        isAuthError: false,
        isValidationError: false,
        isNetworkError: true,
      };
    }

    // GraphQL errors
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const firstError = error.graphQLErrors[0];
      const extensions = firstError.extensions as GraphQLErrorExtensions;
      const code = extensions?.code;

      // Authentication errors
      if (code === 'UNAUTHENTICATED') {
        return {
          message: 'Please connect your wallet to continue',
          code,
          isAuthError: true,
          isValidationError: false,
          isNetworkError: false,
        };
      }

      // Invalid signature
      if (code === 'INVALID_SIGNATURE') {
        return {
          message: 'Invalid wallet signature. Please try again.',
          code,
          isAuthError: true,
          isValidationError: false,
          isNetworkError: false,
        };
      }

      // User not found
      if (code === 'USER_NOT_FOUND') {
        return {
          message: 'User not found. Please request a nonce first.',
          code,
          isAuthError: true,
          isValidationError: false,
          isNetworkError: false,
        };
      }

      // Validation errors
      if (code === 'INVALID_PAYMENT_PROOF' || code === 'BAD_USER_INPUT') {
        return {
          message: firstError.message || 'Invalid input. Please check your data.',
          code,
          isAuthError: false,
          isValidationError: true,
          isNetworkError: false,
        };
      }

      // Generic GraphQL error
      return {
        message: firstError.message || 'An error occurred',
        code: code || 'GRAPHQL_ERROR',
        isAuthError: false,
        isValidationError: false,
        isNetworkError: false,
      };
    }

    // Generic Apollo error
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'APOLLO_ERROR',
      isAuthError: false,
      isValidationError: false,
      isNetworkError: false,
    };
  }

  // Handle standard Error
  if (isError(error)) {
    return {
      message: error.message,
      code: 'ERROR',
      isAuthError: false,
      isValidationError: false,
      isNetworkError: false,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'UNKNOWN',
      isAuthError: false,
      isValidationError: false,
      isNetworkError: false,
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN',
    isAuthError: false,
    isValidationError: false,
    isNetworkError: false,
  };
}

/**
 * Get user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  return parseGraphQLError(error).message;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return parseGraphQLError(error).isAuthError;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return parseGraphQLError(error).isNetworkError;
}

/**
 * Log error to console in development
 */
export function logError(error: unknown, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}

/**
 * Handle GraphQL error with optional callback
 */
export function handleGraphQLError(
  error: unknown,
  options?: {
    onAuthError?: () => void;
    onNetworkError?: () => void;
    context?: string;
  }
): ParsedGraphQLError {
  const parsed = parseGraphQLError(error);
  
  // Log in development
  logError(error, options?.context);

  // Handle auth errors
  if (parsed.isAuthError && options?.onAuthError) {
    options.onAuthError();
  }

  // Handle network errors
  if (parsed.isNetworkError && options?.onNetworkError) {
    options.onNetworkError();
  }

  return parsed;
}

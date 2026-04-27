export function reportClientError(error: unknown, context?: string) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (context) {
    console.error(context, error);
    return;
  }

  console.error(error);
}

export function reportClientWarning(error: unknown, context?: string) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (context) {
    console.warn(context, error);
    return;
  }

  console.warn(error);
}

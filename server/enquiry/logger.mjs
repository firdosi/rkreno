export function createOperationalLogger(write = (record) => console.log(JSON.stringify(record))) {
  return {
    record(fields) {
      const permitted = [
        'requestId', 'timestamp', 'environment', 'resultCode', 'service', 'durationMs',
        'turnstileResult', 'rateLimitResult', 'mailResult',
      ];
      write(Object.fromEntries(permitted.filter((key) => fields[key] !== undefined)
        .map((key) => [key, fields[key]])));
    },
  };
}

import { clientConfig } from './client-config.generated';

export const environment = {
  production: false,
  ...clientConfig,
};

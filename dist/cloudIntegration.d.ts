import AWS from 'aws-sdk';
import { CloudSecrets } from './types';
declare const initAWS: () => AWS.SecretsManager;
export declare function fetchCloudSecrets(): Promise<CloudSecrets>;
export { initAWS };

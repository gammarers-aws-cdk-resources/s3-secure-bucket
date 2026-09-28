import { ProjenCdkConstructLibrary } from '@gammarers/projen-projects';
const project = new ProjenCdkConstructLibrary({
  cdkVersion: '2.232.0',
  name: 's3-secure-bucket',
  repository: 'https://github.com/gammarers-aws-cdk-resources/s3-secure-bucket.git',
  description: 'S3 Secure Bucket is a construct that creates a secure bucket with encryption, logging, and other security features.',
  devDeps: [
    '@gammarers/projen-projects@^0.3.2',
  ],
  releaseToNpm: true,
  npmTrustedPublishing: true,
  tsconfigDev: {
    compilerOptions: {
      strict: true,
    },
  },
});
project.addPackageIgnore('/.devcontainer');
project.synth();
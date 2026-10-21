import { ProjenCdkConstructLibrary } from '@gammarers/projen-projects';
const project = new ProjenCdkConstructLibrary({
  cdkVersion: '2.232.0',
  name: 's3-secure-bucket',
  repositoryUrl: 'https://github.com/gammarers-aws-cdk-resources/s3-secure-bucket.git',
  description: 'AWS CDK construct for a secure Amazon S3 bucket with private access, encryption, versioning, and bucketType presets for logs and origins.',
  devDeps: [
    '@gammarers/projen-projects@^0.5.10',
  ],
  releaseToNpm: true,
  npmTrustedPublishing: true,
});
project.synth();
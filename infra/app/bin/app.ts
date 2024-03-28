#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NginxAppStack } from '../lib/stacks/nginx-app-stack';

const app = new cdk.App();

// Create the Nginx app stack
const nginx = new NginxAppStack(app, 'NginxAppStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
cdk.Tags.of(nginx).add('example.com/stack', nginx.stackName);

// Add global tags
cdk.Tags.of(app).add('example.com/level', 'app');

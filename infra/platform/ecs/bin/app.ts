#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcsStack } from '../lib/stacks/ecs-stack';

const app = new cdk.App();

// Create ECS stack
const ecs = new EcsStack(app, 'EcsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
cdk.Tags.of(ecs).add('example.com/stack', ecs.stackName);

// Add global tags
cdk.Tags.of(app).add('example.com/level', 'platform');
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';

const app = new cdk.App();

// Create network stack
const network = new NetworkStack(app, 'NetworkStack', {});
cdk.Tags.of(network).add('example.com/stack', network.stackName);

// Add global tags
cdk.Tags.of(app).add('example.com/level', 'platform');

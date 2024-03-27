import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc0 } from '../components/vpc-0';

export class NetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create vpc-0
    new Vpc0(this, 'Vpc0');
  }
}

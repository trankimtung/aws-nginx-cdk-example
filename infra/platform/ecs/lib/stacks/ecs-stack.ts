import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Ecs0Cluster } from '../components/ecs-0-cluster';

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create ecs-0 cluster
    new Ecs0Cluster(this, 'Ecs0');
  }
}

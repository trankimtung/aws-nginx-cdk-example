import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NginxEcsDeployment } from '../components/nginx-ecs-deployment';

export class NginxAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create ECS deployment for the Nginx app
    new NginxEcsDeployment(this, 'NginxEcsDeployment');
  }
}

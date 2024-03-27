import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * ecs-0 cluster
 */
export class Ecs0Cluster extends Construct {
    public readonly cluster: cdk.aws_ecs.ICluster;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        // Lookup vpc-0
        const vpc0Id = cdk.aws_ssm.StringParameter.valueFromLookup(this, '/platform/network/vpc-0/vpc-id');
        const vpc0 = cdk.aws_ec2.Vpc.fromLookup(this, 'Vpc', {
            vpcId: vpc0Id,
        });

        this.cluster = this.createEcsCluster(vpc0);
        this.exportParams(this.cluster);
    }

    /**
     * Create ecs-0 cluster
     * 
     * @param vpc vpc
     * @returns ecs-0 cluster
     */
    private createEcsCluster(vpc: cdk.aws_ec2.IVpc): cdk.aws_ecs.ICluster {
        const cluster = new cdk.aws_ecs.Cluster(this, 'Cluster', {
            clusterName: 'ecs-0',
            vpc: vpc,
            containerInsights: true,
            enableFargateCapacityProviders: true,
        });
        cluster.addDefaultCapacityProviderStrategy([
            {
                capacityProvider: 'FARGATE',
                weight: 1,
            },
            {
                capacityProvider: 'FARGATE_SPOT',
                weight: 10, // prioritize FARGATE_SPOT over FARGATE to reduce cost
            },
        ]);
        return cluster;
    }

    /**
     * Export parameters to SSM and CloudFormation outputs
     * 
     * @param cluster ecs cluster
     */
    private exportParams(cluster: cdk.aws_ecs.ICluster) {
        // Output the ECS cluster ARN
        new cdk.CfnOutput(this, 'ClusterArn', {
            value: cluster.clusterArn,
        });

        // Output the ECS cluster ARN to an SSM parameter
        new cdk.aws_ssm.StringParameter(this, 'ClusterArnParameter', {
            parameterName: '/platform/ecs/ecs-0/cluster-arn',
            stringValue: cluster.clusterArn,
        });
    }
}
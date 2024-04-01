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

        // this.cluster = this.createEcsClusterWithFargateCapacityProvider(vpc0);
        this.cluster = this.createEcsClusterWithEc2CapacityProvider(vpc0);
        this.exportParams(this.cluster);
    }

    /**
     * Create ecs-0 cluster with Fargate capacity providers.
     */
    private createEcsClusterWithFargateCapacityProvider(vpc: cdk.aws_ec2.IVpc): cdk.aws_ecs.ICluster {
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
     * Create ecs-0 cluster with EC2 capacity providers.
     * 
     * This is particularly useful for organizations with strict security and compliance requirements, 
     * or running workloads that require specialized hardware (GPUs, FPGAs, etc.)
     */
    private createEcsClusterWithEc2CapacityProvider(vpc: cdk.aws_ec2.IVpc): cdk.aws_ecs.ICluster {
        const cluster = new cdk.aws_ecs.Cluster(this, 'Cluster', {
            clusterName: 'ecs-0',
            vpc: vpc,
            containerInsights: true,
        });
        const arm64Asg = new cdk.aws_autoscaling.AutoScalingGroup(this, 'ARM64ASG', {
            vpc: vpc,
            instanceType: new cdk.aws_ec2.InstanceType('t4g.medium'),
            machineImage: new cdk.aws_ecs.BottleRocketImage({
                architecture: cdk.aws_ec2.InstanceArchitecture.ARM_64,
                variant: cdk.aws_ecs.BottlerocketEcsVariant.AWS_ECS_2,
            }), // can be replaced with a hardened AMI
            minCapacity: 1,
            maxCapacity: 10,
            vpcSubnets: {
                subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED, // deploy EC2 instances to isolated subnets without internet access
            },
            groupMetrics: [cdk.aws_autoscaling.GroupMetrics.all()],
            newInstancesProtectedFromScaleIn: true,
            requireImdsv2: true,
            ssmSessionPermissions: true,
            maxInstanceLifetime: cdk.Duration.days(360),
            minHealthyPercentage: 30,
            maxHealthyPercentage: 100,
            updatePolicy: cdk.aws_autoscaling.UpdatePolicy.rollingUpdate({
                pauseTime: cdk.Duration.minutes(5),
                minInstancesInService: 1,
                maxBatchSize: 5,
            }),
        });
        const arm64CapacityProvider = new cdk.aws_ecs.AsgCapacityProvider(this, 'ARM64CapacityProvider', {
            capacityProviderName: 'arm64',
            autoScalingGroup: arm64Asg,
            machineImageType: cdk.aws_ecs.MachineImageType.BOTTLEROCKET,
            enableManagedTerminationProtection: true,
            enableManagedDraining: true,
            enableManagedScaling: true,
            spotInstanceDraining: true,
            canContainersAccessInstanceRole: false,
        });
        cluster.addAsgCapacityProvider(arm64CapacityProvider);
        cluster.addDefaultCapacityProviderStrategy([
            {
                capacityProvider: arm64CapacityProvider.capacityProviderName,
                weight: 1,
            },
        ]);
        return cluster;
    }

    /**
     * Export parameters to SSM and CloudFormation outputs
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
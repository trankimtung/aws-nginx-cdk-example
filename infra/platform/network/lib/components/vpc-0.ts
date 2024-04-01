import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * vpc-0
 */
export class Vpc0 extends Construct {
    public readonly vpc: cdk.aws_ec2.IVpc;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.vpc = this.createVpc();
        this.exportParams(this.vpc);
    }

    /**
     * Create vpc-0
     * 
     * @returns vpc-0
     */
    private createVpc(): cdk.aws_ec2.IVpc {
        const vpcName = 'vpc-0';
        const vpc = new cdk.aws_ec2.Vpc(this, 'Vpc', {
            vpcName: vpcName,
            ipAddresses: cdk.aws_ec2.IpAddresses.cidr('10.0.0.0/16'),
            maxAzs: 2,
            subnetConfiguration: [
                {
                    cidrMask: 20,
                    name: 'Public',
                    subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 20,
                    name: 'Private',
                    subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    cidrMask: 20,
                    name: 'Isolated',
                    subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
            enableDnsHostnames: true,
            enableDnsSupport: true,
            restrictDefaultSecurityGroup: true,
        });
        vpc.addGatewayEndpoint('S3', {
            service: cdk.aws_ec2.GatewayVpcEndpointAwsService.S3,
        });
        vpc.addInterfaceEndpoint('ECR', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.ECR,
        });
        vpc.addInterfaceEndpoint('ECR_DOCKER', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
        });
        vpc.addInterfaceEndpoint('CLOUDWATCH', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        });
        vpc.addInterfaceEndpoint('SECRETS_MANAGER', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        });
        vpc.addInterfaceEndpoint('ECS', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.ECS,
        });
        vpc.addInterfaceEndpoint('ECS_AGENT', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.ECS_AGENT,
        });
        vpc.addInterfaceEndpoint('ECS_TELEMETRY', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.ECS_TELEMETRY,
        });
        vpc.addInterfaceEndpoint('SSM', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.SSM,
        });
        vpc.addInterfaceEndpoint('SSM_MESSAGES', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
        });
        vpc.addInterfaceEndpoint('EC2_MESSAGES', {
            service: cdk.aws_ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
        });
        cdk.Tags.of(vpc).add('example.com/vpc-name', vpcName);
        return vpc;
    }

    /**
     * Export parameters to SSM and CloudFormation outputs
     */
    private exportParams(vpc: cdk.aws_ec2.IVpc) {
        // Output the VPC IDcdk.aws_ec2.IVpc) {
        new cdk.CfnOutput(this, 'VpcId', {
            value: vpc.vpcId,
        });

        // Output the VPC CIDR
        new cdk.CfnOutput(this, 'VpcCidr', {
            value: vpc.vpcCidrBlock,
        });

        // Output the VPC ID to an SSM parameter
        new cdk.aws_ssm.StringParameter(this, 'VpcIdParameter', {
            parameterName: '/platform/network/vpc-0/vpc-id',
            stringValue: vpc.vpcId,
        });

        // Output the VPC CIDR to an SSM parameter
        new cdk.aws_ssm.StringParameter(this, 'VpcCidrParameter', {
            parameterName: '/platform/network/vpc-0/vpc-cidr',
            stringValue: vpc.vpcCidrBlock,
        });
    }
}
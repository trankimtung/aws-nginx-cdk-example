import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PublicAlb } from './public-alb';
import { PublicTlsCert } from './public-cert';

/**
 * Nginx ECS deployment
 */
export class NginxEcsDeployment extends Construct {
    public readonly cluster: cdk.aws_ecs.ICluster;
    public readonly taskDefinition: cdk.aws_ecs.TaskDefinition;
    public readonly service: cdk.aws_ecs.FargateService;
    public readonly publicHostedZone: cdk.aws_route53.IHostedZone;
    public readonly publicLoadBalancer: PublicAlb;
    public readonly publicTlsCert: PublicTlsCert;
    public readonly publicAliasRecord: cdk.aws_route53.ARecord;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        // Subdomain for the nginx service
        const subdomain = 'nginx';

        // Lookup existing ecs-0 cluster        
        this.cluster = this.lookupEcs0Cluster();

        // Create ECS task definition and service
        this.taskDefinition = this.createTaskDefinition();
        this.service = this.createService(this.cluster, this.taskDefinition);

        // Lookup existing r53-public-0 route53 hosted zone
        this.publicHostedZone = this.lookupR53Public0Zone();

        // Create public tls certificate and public load balancer
        this.publicTlsCert = this.createPublicTlsCert(subdomain, this.publicHostedZone);
        this.publicLoadBalancer = this.createPublicLoadBalancer(this.service, this.publicTlsCert);

        // Create DNS alias record for the public load balancer
        this.publicAliasRecord = this.createR53AliasRecord(subdomain, this.publicHostedZone, this.publicLoadBalancer);

        this.exportParams(this.service, this.publicLoadBalancer, this.publicAliasRecord);
    }

    /**
     * Lookup ecs-0 cluster
     */
    private lookupEcs0Cluster(): cdk.aws_ecs.ICluster {
        const vpc0Id = cdk.aws_ssm.StringParameter.valueFromLookup(this, '/platform/network/vpc-0/vpc-id');
        return cdk.aws_ecs.Cluster.fromClusterAttributes(this, 'Cluster', {
            clusterName: 'ecs-0',
            vpc: cdk.aws_ec2.Vpc.fromLookup(this, 'Vpc', {
                vpcId: vpc0Id,
            }),
        });
    }

    /**
     * Create task definition
     */
    private createTaskDefinition(): cdk.aws_ecs.TaskDefinition {
        const taskDefinition = new cdk.aws_ecs.FargateTaskDefinition(this, 'TaskDefinition', {
            cpu: 256,
            memoryLimitMiB: 512,
            runtimePlatform: {
                operatingSystemFamily: cdk.aws_ecs.OperatingSystemFamily.LINUX,
                cpuArchitecture: cdk.aws_ecs.CpuArchitecture.ARM64,
            },
            volumes: [
                {
                    name: 'tmp',
                },
            ],
        });
        const appContainer = taskDefinition.addContainer('AppContainer', {
            containerName: 'app',
            // Build the Docker image from the app directory
            image: cdk.aws_ecs.ContainerImage.fromAsset('../../app', {
                platform: cdk.aws_ecr_assets.Platform.LINUX_ARM64,
            }),
            memoryLimitMiB: 512,
            logging: cdk.aws_ecs.LogDrivers.awsLogs({
                streamPrefix: 'ecs',
                logRetention: cdk.aws_logs.RetentionDays.EIGHT_YEARS,
                mode: cdk.aws_ecs.AwsLogDriverMode.NON_BLOCKING,
            }),
            essential: true,
            user: 'nginx',
            readonlyRootFilesystem: true,
            portMappings: [
                {
                    containerPort: 8080,
                }
            ],
            healthCheck: {
                command: [
                    'CMD-SHELL',
                    // Check if nginx process is running
                    'pgrep nginx || exit 1',
                ],
                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(3),
                retries: 6,
                startPeriod: cdk.Duration.seconds(10),
            },
        });
        appContainer.addMountPoints({
            containerPath: '/tmp',
            sourceVolume: 'tmp',
            readOnly: false,
        });
        return taskDefinition;
    }

    /**
     * Create ecs service
     */
    private createService(cluster: cdk.aws_ecs.ICluster, taskDefinition: cdk.aws_ecs.TaskDefinition): cdk.aws_ecs.FargateService {
        const service = new cdk.aws_ecs.FargateService(this, 'Service', {
            cluster: cluster,
            taskDefinition: taskDefinition,
            vpcSubnets: {
                subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED, // do not expose task instances to the internet
            },
        })

        // Auto scaling
        const scaling = service.autoScaleTaskCount({
            maxCapacity: 10,
            minCapacity: 1,
        });
        scaling.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 60,
        });

        return service;
    }

    /**
     * Lookup r53-public-0 hosted zone
     */
    private lookupR53Public0Zone(): cdk.aws_route53.IHostedZone {
        const hostedZoneId = cdk.aws_ssm.StringParameter.valueForStringParameter(this, '/platform/network/r53-public-0/zone-id');
        const hostedZoneName = cdk.aws_ssm.StringParameter.valueForStringParameter(this, '/platform/network/r53-public-0/zone-name');
        return cdk.aws_route53.PublicHostedZone.fromHostedZoneAttributes(this, 'R53Public0Zone', {
            hostedZoneId: hostedZoneId,
            zoneName: hostedZoneName,
        });
    }

    /**
     * Create a public load balancer
     */
    private createPublicLoadBalancer(service: cdk.aws_ecs.FargateService, tlsCert: PublicTlsCert): PublicAlb {
        const alb = new PublicAlb(this, 'PublicAlb', {
            vpc: service.cluster.vpc,
            targets: [service],
            targetPort: 8080,
            certificate: tlsCert.certificate,
        });
        return alb;
    }

    /**
     * Create a public tls certificate
     */
    private createPublicTlsCert(subdomain: string, zone: cdk.aws_route53.IHostedZone): PublicTlsCert {
        const cert = new PublicTlsCert(this, 'PublicTlsCert', {
            domainName: `${subdomain}.${zone.zoneName}`,
            hostedZoneId: zone.hostedZoneId,
        });
        return cert;
    }

    /**
     * Create a DNS alias record
     */
    private createR53AliasRecord(subdomain:string, zone: cdk.aws_route53.IHostedZone, loadBalancer: PublicAlb): cdk.aws_route53.ARecord {
        return new cdk.aws_route53.ARecord(this, 'PublicR53AliasRecord', {
            zone: zone,
            recordName: subdomain,
            target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.LoadBalancerTarget(loadBalancer.loadBalancer)),
        });
    }

    private exportParams(service: cdk.aws_ecs.FargateService, publicLoadBalancer: PublicAlb, publicAliasRecord: cdk.aws_route53.ARecord) {
        // Output the ECS service ARN
        new cdk.CfnOutput(this, 'EcsServiceArn', {
            value: this.service.serviceArn,
        });

        // Output the public load balancer ARN
        new cdk.CfnOutput(this, 'PublicLoadBalancerArn', {
            value: this.publicLoadBalancer.loadBalancer.loadBalancerArn,
        });

        // Output the public load balancer DNS name
        new cdk.CfnOutput(this, 'AppUrl', {
            value: publicAliasRecord.domainName,
        });
    }
}
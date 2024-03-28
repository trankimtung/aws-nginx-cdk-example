import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

interface CustomLoadBalancerProps {
    vpc: cdk.aws_ec2.IVpc;
    targets: elbv2.IApplicationLoadBalancerTarget[];
    targetPort: number;
    certificate: elbv2.IListenerCertificate;
}

/**
 * Public application load balancer
 */
export class PublicAlb extends Construct {
    public readonly props: CustomLoadBalancerProps;
    public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
    public readonly httpsListener: elbv2.ApplicationListener;

    constructor(scope: Construct, id: string, props: CustomLoadBalancerProps) {
        super(scope, id);
        this.props = props;

        this.loadBalancer = this.createLoadBalancer(props.vpc);
        this.httpsListener = this.addHttpsListener(this.loadBalancer, props.targets, props.targetPort, props.certificate);
        this.redirectHttpToHttps(this.loadBalancer);
    }

    /**
     * Create public application load balancer
     */
    private createLoadBalancer(vpc: cdk.aws_ec2.IVpc): elbv2.ApplicationLoadBalancer {
        return new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
            vpc: vpc,
            internetFacing: true,
            dropInvalidHeaderFields: true,
            desyncMitigationMode: elbv2.DesyncMitigationMode.DEFENSIVE,
        });
    }

    /**
     * Add HTTPS listener to the load balancer
     */
    private addHttpsListener(loadBalancer: elbv2.ApplicationLoadBalancer, targets: elbv2.IApplicationLoadBalancerTarget[], targetPort: number, certificate: elbv2.IListenerCertificate): elbv2.ApplicationListener {
        const listener = loadBalancer.addListener('443Listener', {
            port: 443,
            open: true,
            sslPolicy: elbv2.SslPolicy.FORWARD_SECRECY_TLS12_RES,
            certificates: [
                certificate,
            ],
        });
        listener.addTargets('DefaultTargets', {
            targets: targets,
            port: targetPort,
        });
        return listener;
    }

    /**
     * Redirect HTTP to HTTPS
     */
    private redirectHttpToHttps(loadBalancer: elbv2.ApplicationLoadBalancer) {
        loadBalancer.addRedirect({
            open: true,
            sourcePort: 80,
            targetPort: 443,
        });
    }
}
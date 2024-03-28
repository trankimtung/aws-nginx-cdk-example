import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

interface PublicTlsCertProps {
    domainName: string;
    hostedZoneId: string;
}

/**
 * Public TLS certificate
 */
export class PublicTlsCert extends Construct {
    public readonly props: PublicTlsCertProps;
    public readonly certificate: acm.Certificate;

    constructor(scope: Construct, id: string, props: PublicTlsCertProps) {
        super(scope, id);
        this.props = props;

        const hostedZone = cdk.aws_route53.PublicHostedZone.fromHostedZoneId(this, 'HostedZone', props.hostedZoneId);
        
        // Create a tls certificate
        this.certificate = new acm.Certificate(this, 'Certificate', {
            domainName: props.domainName,
            // automatically validate the certificate using DNS
            validation: acm.CertificateValidation.fromDnsMultiZone({
                [props.domainName]: hostedZone,
            }),
            keyAlgorithm: acm.KeyAlgorithm.RSA_2048,
        });
    }
}
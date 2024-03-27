import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

/**
 * r53-public-0
 */
export class R53Public0HostedZone extends Construct {
    public readonly zone: route53.IPublicHostedZone;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.zone = this.createPublicHostedZone();
        this.exportParams(this.zone);
    }

    /**
     * Create public-0 Route53 Hosted Zone
     * 
     * @returns public-0
     */
    private createPublicHostedZone() {
        const zone = new route53.PublicHostedZone(this, 'Zone', {
            zoneName: 'example.trankimtung.com',
        });
        return zone;
    }

    /**
     * Export parameters to SSM and CloudFormation outputs
     */
    private exportParams(zone: route53.IPublicHostedZone) {
        // Output the zone ID
        new cdk.CfnOutput(this, 'ZoneId', {
            value: zone.hostedZoneId,
        });

        // Output the zone name
        new cdk.CfnOutput(this, 'ZoneName', {
            value: zone.zoneName,
        });

        // Output the zone id to SSM parameter
        new cdk.aws_ssm.StringParameter(this, 'ZoneIdParameter', {
            parameterName: '/platform/network/r53-public-0/zone-id',
            stringValue: zone.hostedZoneId,
        });

        // Output the zone name to SSM parameter
        new cdk.aws_ssm.StringParameter(this, 'ZoneNameParameter', {
            parameterName: '/platform/network/r53-public-0/zone-name',
            stringValue: zone.zoneName,
        });
    }

}
import * as aws from '@pulumi/aws';
import { SimpleVpc } from './SimpleVpc';

export class AuroraSecurityGroup {
    public readonly securityGroup: aws.ec2.SecurityGroup;
    constructor(name: string, vpc: SimpleVpc) {
        this.securityGroup = new aws.ec2.SecurityGroup(name, {
            vpcId: vpc.vpc.vpcId,
            description: 'Allow access to Aurora',
        });

        // Ingress rule
        const allowAuroraAccess = new aws.vpc.SecurityGroupIngressRule('allow-aurora-access', {
            description: 'Allow access to Aurora',
            securityGroupId: this.securityGroup.id,
            ipProtocol: 'tcp',
            cidrIpv4: vpc.vpc.vpc.cidrBlock,
            fromPort: 3306,
            toPort: 3306,
        });

        // Egress rule
        const allowAllOutbound = new aws.vpc.SecurityGroupEgressRule('allow-all-outbound', {
            description: 'Allow all outbound traffic',
            securityGroupId: this.securityGroup.id,
            ipProtocol: '-1',
            cidrIpv4: '0.0.0.0/0',
        });
    }
}

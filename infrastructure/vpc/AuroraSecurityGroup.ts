import * as aws from "@pulumi/aws";
import {SimpleVpc} from "./SimpleVpc";


export class AuroraSecurityGroup {
    public readonly securityGroup: aws.ec2.SecurityGroup;
    constructor(name: string, vpc: SimpleVpc)
    {
        this.securityGroup = new aws.ec2.SecurityGroup(name, {
            vpcId: vpc.vpc.vpcId,
            description: "Allow access to Aurora",
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 3306,
                    toPort: 3306,
                    cidrBlocks: ["10.0.0.0/16"],
                },
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                },
            ]
        });
    }
}

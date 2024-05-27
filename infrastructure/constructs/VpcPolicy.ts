import * as aws from "@pulumi/aws";

export class VpcPolicy {
    public readonly vpcPolicy: aws.iam.Policy

    constructor() {
        this.vpcPolicy = new aws.iam.Policy("vpcPolicy", {
            policy: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "ec2:CreateNetworkInterface",
                        "ec2:DescribeNetworkInterfaces",
                        "ec2:DeleteNetworkInterface",
                    ],
                    Resource: "*",
                },]
            }
        });
    }
}

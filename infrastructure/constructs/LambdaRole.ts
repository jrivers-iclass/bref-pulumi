import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class LambdaRole {
    public readonly lambdaRole: aws.iam.Role;

    constructor(name: string,   s3Bucket: aws.s3.Bucket) {
        this.lambdaRole = new aws.iam.Role(`${name}-lambdaRole`, {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "lambda.amazonaws.com" }),
        });

        // Attach the AWSLambdaBasicExecutionRole policy to the role
        const lambdaRolePolicy = new aws.iam.RolePolicyAttachment(`${name}-lambdaRolePolicy`, {
            role: this.lambdaRole.name,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
        });

        const lambdaRoleS3Policy = new aws.iam.RolePolicy(`${name}-lambdaRoleS3Policy`, {
            role: this.lambdaRole.name,
            policy: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    Resource: [
                        pulumi.interpolate`${s3Bucket.arn}/*`,
                        pulumi.interpolate`${s3Bucket.arn}`
                    ]
                }]
            }
        });

    }
}

import * as aws from "@pulumi/aws";

export class LambdaRole {
    public readonly lambdaRole: aws.iam.Role;
    public readonly name: string;

    constructor(name: string) {
        this.name = name;
        this.lambdaRole = new aws.iam.Role(`${name}-lambdaRole`, {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "lambda.amazonaws.com" }),
        });

        // Attach the AWSLambdaBasicExecutionRole policy to the role
        new aws.iam.RolePolicyAttachment(`${name}-lambdaRolePolicy`, {
            role: this.lambdaRole.name,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
        });
    }

    addPolicy(name: string, policy: aws.iam.Policy) {
        return new aws.iam.RolePolicy(`${this.name}-${name}`, {
            role: this.lambdaRole.name,
            policy: policy.policy,
        });
    }
}

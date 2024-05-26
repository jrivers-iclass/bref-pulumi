import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {WebApp} from "./constructs/WebApp";

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("bref-example-bucket");

// Create an IAM Role for the Web App
const lambdaRole = new aws.iam.Role("lambdaRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "lambda.amazonaws.com" }),
});

// Attach the AWSLambdaBasicExecutionRole policy to the role
const lambdaRolePolicy = new aws.iam.RolePolicyAttachment("lambdaRolePolicy", {
    role: lambdaRole.name,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

// Create the WebApp
const webApp = new WebApp(
    new pulumi.asset.FileArchive("../laravel"),
    bucket,
    lambdaRole
);


// Export the URL of the API Gateway
export const apiUrl = pulumi.interpolate`${webApp.httpApi.apiUrl}`;
// Export the name of the bucket
export const bucketName = bucket.id;
// Export the Lambda function name
export const lambdaName = webApp.phpFpmFunction.lambda.name;
// Export the Lambda Policy ARN
export const lambdaPolicyArn = lambdaRolePolicy.policyArn;

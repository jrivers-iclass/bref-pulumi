import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {PhpFpmFunction} from "./function/PhpFpmFunction";
import {FunctionHttpApi} from "./api_gateway/FunctionApi";

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("bref-example-bucket");

const lambdaRole = new aws.iam.Role("lambdaRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "lambda.amazonaws.com" }),
});

const lambdaRolePolicy = new aws.iam.RolePolicyAttachment("lambdaRolePolicy", {
    role: lambdaRole.name,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

// Create an HTTP API
const httpApi = new FunctionHttpApi("laravel-test");
// Create a Lambda function
const phpFpmFunction = new PhpFpmFunction(
    "laravel-test",
    new pulumi.asset.FileArchive("../laravel"),
    bucket.id,
    lambdaRole.arn,
    "public/index.php", {
        APP_URL: pulumi.interpolate`${httpApi.apiUrl}`,
    });
// Create lambda integration with the API Gateway
httpApi.addIntegration(phpFpmFunction.lambda.arn);
// Deploy the stage
httpApi.deployStage(pulumi.getStack());



// Export the URL of the API Gateway
export const apiUrl = pulumi.interpolate`${httpApi.apiUrl}`;
// Export the name of the bucket
export const bucketName = bucket.id;
// Export the Lambda function name
export const lambdaName = phpFpmFunction.lambda.name;
// Export the Lambda Policy ARN
export const lambdaPolicyArn = lambdaRolePolicy.policyArn;

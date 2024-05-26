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

const phpFpmFunction = new PhpFpmFunction(
    "laravel-test",
    new pulumi.asset.FileArchive("../laravel"),
    bucket.id,
    lambdaRole.arn,
    "Bref\\LaravelBridge\\Http\\HttpHandler", {
        APP_KEY: "base64:G8tY4z7J6zCfFmQ5v",
    });

// Create an HTTP API for the lambda function
const httpApi = new FunctionHttpApi("laravel-test", phpFpmFunction.lambda.arn);

// Export the URL of the API Gateway
export const apiUrl = pulumi.interpolate`${httpApi.apiUrl}`;
// Export the name of the bucket
export const bucketName = bucket.id;
// Export the Lambda function name
export const lambdaName = phpFpmFunction.lambda.name;
// Export the Lambda Policy ARN
export const lambdaPolicyArn = lambdaRolePolicy.policyArn;

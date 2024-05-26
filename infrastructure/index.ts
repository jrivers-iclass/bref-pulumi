import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {WebApp} from "./constructs/WebApp";
import {ConsoleApp} from "./constructs/ConsoleApp";
import {LambdaRole} from "./constructs/LambdaRole";

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("bref-example-bucket");

// Create the Lambda Role
const lambdaRole = new LambdaRole("lambdaRole", bucket);

// Create the WebApp
const webApp = new WebApp(
    "laravel-test",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    {
        FILESYSTEM_DISK: "s3",
        AWS_BUCKET: bucket.bucket,
        DB_DATABASE: ":memory:",
    }
);

const consoleApp = new ConsoleApp(
    "laravel-test-artisan",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    {
        FILESYSTEM_DISK: "s3",
        AWS_BUCKET: bucket.bucket,
        DB_DATABASE: ":memory:",
    }
);


// Export the URL of the API Gateway
export const apiUrl = pulumi.interpolate`${webApp.httpApi.apiUrl}`;
// Export the name of the bucket
export const bucketName = bucket.id;
// Export the Lambda function name
export const lambdaName = webApp.phpFpmFunction.lambda.name;
// Export the Lambda Policy ARN
export const lambdaRoleArn = lambdaRole.lambdaRole.arn;
// Export console Lambda function name
export const consoleLambdaName = consoleApp.phpFpmFunction.lambda.name;

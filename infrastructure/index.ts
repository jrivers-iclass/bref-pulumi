import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {WebApp, ConsoleApp, LambdaRole, S3BucketPolicy} from "./constructs";
import {SqsWorker} from "./constructs/SqsWorker";

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("bref-example-bucket");

// Create the Lambda Role
const lambdaRole = new LambdaRole("lambdaRole");
lambdaRole.addPolicy("s3", new S3BucketPolicy(bucket).bucketPolicy);

const environment = {
    FILESYSTEM_DISK: "s3",
    AWS_BUCKET: bucket.bucket,
    DB_DATABASE: ":memory:",
};

// Create the WebApp
const webApp = new WebApp(
    "laravel-test",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    environment
);

const consoleApp = new ConsoleApp(
    "laravel-test-artisan",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    environment
);

const sqsWorker = new SqsWorker(
    "laravel-test-worker",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    environment
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
// Export worker Lambda function name
export const workerLambdaName = sqsWorker.phpFunction.lambda.name;
// Export the queue URL
export const queueUrl = sqsWorker.queue.url;

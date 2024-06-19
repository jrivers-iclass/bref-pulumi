import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {WebApp, ConsoleApp, LambdaRole, S3BucketPolicy} from "./constructs";
import {SqsWorker} from "./constructs/SqsWorker";
import {SimpleVpc} from "./vpc/SimpleVpc";
import {AuroraSecurityGroup} from "./vpc/AuroraSecurityGroup";
import {AuroraServerless} from "./constructs/AuroraServerless";
import {VpcPolicy} from "./constructs/VpcPolicy";
import { readFileSync } from "fs";

// Create a VPC
const vpc = new SimpleVpc(
    "lambda-test-vpc",
    true,
    true,
    true,
    2,
    "10.0.0.0/16");
const securityGroup = new AuroraSecurityGroup(
    "lambda-test-aurora-security-group", vpc);
// Create an Aurora Serverless v2 cluster
const auroraCluster = new AuroraServerless(
    "laravel-test-aurora", vpc, securityGroup);
// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("bref-example-bucket");

// Create the Lambda Role
const lambdaRole = new LambdaRole("lambdaRole");
lambdaRole.addPolicy("s3", new S3BucketPolicy(bucket).bucketPolicy);
lambdaRole.addPolicy("vpc", new VpcPolicy().vpcPolicy);

const auroraSecret = auroraCluster.secretArn.apply(secretArn =>
    aws.secretsmanager.getSecretVersion({
        secretId: secretArn,
    })
);

// Extract the username and password from the secret's JSON value
const credentials = auroraSecret.apply(secret => {
    if (!secret.secretString) {
        throw new Error("Secret string is empty");
    }
    const secretJson = JSON.parse(secret.secretString);
    return {
        username: secretJson.username,
        password: secretJson.password,
    };
});

const lambdaVpcConfig = pulumi.all([vpc.vpc.publicSubnetIds, securityGroup.securityGroup.id]).apply(([subnetIds, securityGroupId]) => ({
    subnetIds: subnetIds,
    securityGroupIds: [securityGroupId],
}))


const environment = {
    FILESYSTEM_DISK: "s3",
    AWS_BUCKET: bucket.bucket,
    DB_DATABASE: "laravelTest",
    DB_CONNECTION: "mysql",
    DB_HOST: auroraCluster.endpoint,
    DB_PORT: "3306",
    DB_USERNAME: credentials.username,
    DB_PASSWORD: credentials.password,
};

// Create the WebApp
const webApp = lambdaVpcConfig.apply( vpcConfig =>new WebApp(
    "laravel-test",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    {BREF_LOOP_MAX: 250, ...environment},
    true,
    vpcConfig.subnetIds,
    vpcConfig.securityGroupIds
));

const consoleApp = lambdaVpcConfig.apply( vpcConfig => new ConsoleApp(
    "laravel-test-artisan",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    environment,
    vpcConfig.subnetIds,
    vpcConfig.securityGroupIds
));

const sqsWorker = lambdaVpcConfig.apply( vpcConfig => new SqsWorker(
    "laravel-test-worker",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    environment,
    vpcConfig.subnetIds,
    vpcConfig.securityGroupIds
));


// Export the URL of the API Gateway
export const apiUrl = pulumi.interpolate`${webApp.httpApi.apiUrl}`;
// Export the name of the bucket
export const bucketName = bucket.id;
// Export the Lambda function name
export const lambdaName = webApp.phpFunction.lambda.name;
// Export the Lambda Policy ARN
export const lambdaRoleArn = lambdaRole.lambdaRole.arn;
// Export console Lambda function name
export const consoleLambdaName = consoleApp.phpFpmFunction.lambda.name;
// Export worker Lambda function name
export const workerLambdaName = sqsWorker.phpFunction.lambda.name;
// Export the queue URL
export const queueUrl = sqsWorker.queue.url;
// Export octane flag
export const useOctane = webApp.useOctane;
export const vpcId = vpc.vpc.vpcId;
export const auroraClusterId = auroraCluster.auroraCluster.id;
export const auroraClusterEndpoint = auroraCluster.endpoint;
export const readme = readFileSync("./Pulumi.README.md").toString();

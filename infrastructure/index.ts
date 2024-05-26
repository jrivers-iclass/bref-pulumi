import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {WebApp, ConsoleApp, LambdaRole, S3BucketPolicy} from "./constructs";
import {SqsWorker} from "./constructs/SqsWorker";
import * as awsx from "@pulumi/awsx";

const vpc = new awsx.ec2.Vpc("lambda-test-vpc", {
    cidrBlock: "10.10.0.0/16",
    numberOfAvailabilityZones: 2,
    subnetStrategy: "Auto",
    subnetSpecs: [
        { type: awsx.ec2.SubnetType.Public, cidrMask: 24 },
        { type: awsx.ec2.SubnetType.Private, cidrMask: 24 },
    ],
    natGateways: {
        strategy: awsx.ec2.NatGatewayStrategy.Single,
    },
});

const securityGroup = new aws.ec2.SecurityGroup("auroraSecurityGroup", {
    vpcId: vpc.vpcId,
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
    ],
    tags: {
        Name: "auroraSecurityGroup",
    },
});

// Create an Aurora Serverless v2 cluster
const auroraCluster = new aws.rds.Cluster("laravel-test-cluster", {
    engine: aws.rds.EngineType.AuroraMysql,
    engineVersion: "8.0.mysql_aurora.3.06.0",
    engineMode: aws.rds.EngineMode.Provisioned,
    databaseName: "laravelTest",
    masterUsername: "admin",
    manageMasterUserPassword: true,
    serverlessv2ScalingConfiguration: {
        maxCapacity: 1,
        minCapacity: 0.5,
    },
    skipFinalSnapshot: true,
    vpcSecurityGroupIds: [securityGroup.id],
    dbSubnetGroupName: new aws.rds.SubnetGroup("auroraSubnetGroup", {
        subnetIds: vpc.privateSubnetIds,
        name: "aurora-subnet-group",
    }).name,
});

new aws.rds.ClusterInstance("laravel-test-instance", {
    clusterIdentifier: auroraCluster.id,
    instanceClass: "db.serverless",
    engine: auroraCluster.engine.apply(engine => engine as aws.rds.EngineType),
    dbSubnetGroupName: auroraCluster.dbSubnetGroupName,
    publiclyAccessible: false,
});

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("bref-example-bucket");

// Create the Lambda Role
const lambdaRole = new LambdaRole("lambdaRole");
lambdaRole.addPolicy("s3", new S3BucketPolicy(bucket).bucketPolicy);

// const auroraSecret = aws.secretsmanager.getSecret({
//     arn: auroraCluster.masterUserSecrets.apply(
//         secrets => secrets[0].secretArn
//     ),
// });

const environment = {
    FILESYSTEM_DISK: "s3",
    AWS_BUCKET: bucket.bucket,
    DB_DATABASE: ":memory:",
    DB_CONNECTION: "mysql",
    DB_HOST: auroraCluster.endpoint,
    DB_PORT: "3306",
    DB_USERNAME: "admin",
    DB_PASSWORD: "TODO: REPLACE ME",
};

// Create the WebApp
const webApp = new WebApp(
    "laravel-test",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    {BREF_LOOP_MAX: 250, ...environment},
    true,
);

const consoleApp = new ConsoleApp(
    "laravel-test-artisan",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    environment,
);

const sqsWorker = new SqsWorker(
    "laravel-test-worker",
    new pulumi.asset.FileArchive("../laravel"),
    lambdaRole,
    environment,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
);


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
export const vpcId = vpc.vpcId;
export const auroraClusterId = auroraCluster.id;
export const auroraClusterEndpoint = auroraCluster.endpoint;
export const auroraClusterSecretArn = auroraCluster.masterUserSecrets[0].secretArn;

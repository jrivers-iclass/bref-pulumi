import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {PhpFpmFunction} from "./function/PhpFpmFunction";

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
    bucket.id,
    "laravel-test.zip",
    lambdaRole.arn,
    "Bref\\LaravelBridge\\Http\\HttpHandler", {
        APP_KEY: "base64:G8tY4z7J6zCfFmQ5v"
    });

const myLambda = phpFpmFunction.create();

const httpApi = new aws.apigatewayv2.Api("httpApi", {
    protocolType: "HTTP",
    description: "HTTP API Gateway with a wildcard route",
});

// Integrate the route with the Lambda function
const lambdaIntegration = new aws.apigatewayv2.Integration("lambdaIntegration", {
    apiId: httpApi.id,
    integrationType: "AWS_PROXY",
    integrationUri: myLambda.arn,
    integrationMethod: "POST",
    payloadFormatVersion: "2.0",
});

// Create the wildcard route
const wildcardRoute = new aws.apigatewayv2.Route("wildcardRoute", {
    apiId: httpApi.id,
    routeKey: "$default",
    target: pulumi.interpolate`integrations/${lambdaIntegration.id}`,
});

// Deploy the API
const stage = new aws.apigatewayv2.Stage("stage", {
    apiId: httpApi.id,
    name: "$default",
    autoDeploy: true,
}, { dependsOn: [wildcardRoute] });

// Grant API Gateway permission to invoke the Lambda function
const lambdaPermission = new aws.lambda.Permission("apiGatewayInvokePermission", {
    action: "lambda:InvokeFunction",
    function: myLambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${httpApi.executionArn}/*/*`,
});

// Export the URL of the API Gateway
export const apiUrl = pulumi.interpolate`${httpApi.apiEndpoint}`;
// Export the name of the bucket
export const bucketName = bucket.id;
// Export the Lambda function name
export const lambdaName = myLambda.name;
// Export the Lambda Policy ARN
export const lambdaPolicyArn = lambdaRolePolicy.policyArn;

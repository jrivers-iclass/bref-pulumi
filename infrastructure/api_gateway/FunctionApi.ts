import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class FunctionHttpApi {
    public readonly apiUrl: pulumi.Output<string>;

    constructor(name: string, lambdaArn: pulumi.Input<string>) {
        // Create the API Gateway
        const api = new aws.apigatewayv2.Api(`${name}-api`, {
            protocolType: "HTTP",
            name: `${name}-api`,
        });

        // Create the Lambda integration
        const lambdaIntegration = new aws.apigatewayv2.Integration(`${name}-integration`, {
            apiId: api.id,
            integrationType: "AWS_PROXY",
            integrationUri: lambdaArn,
            integrationMethod: "ANY",
            payloadFormatVersion: "2.0",
        });

        // Create the wildcard route
        const route = new aws.apigatewayv2.Route(`${name}-route`, {
            apiId: api.id,
            routeKey: "$default",
            target: pulumi.interpolate`integrations/${lambdaIntegration.id}`,
        });

        // Create a stage to deploy the API
        const stage = new aws.apigatewayv2.Stage(`${name}-stage`, {
            apiId: api.id,
            name: "$default",
            autoDeploy: true,
        });

        // Add permissions for API Gateway to invoke the Lambda function
        const lambdaPermission = new aws.lambda.Permission(`${name}-lambda-permission`, {
            action: "lambda:InvokeFunction",
            function: lambdaArn,
            principal: "apigateway.amazonaws.com",
            sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
        });

        // Export the API URL
        this.apiUrl = pulumi.interpolate`${api.apiEndpoint}`;
    }
}

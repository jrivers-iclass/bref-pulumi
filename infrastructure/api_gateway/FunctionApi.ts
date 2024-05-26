import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class FunctionHttpApi {
    public readonly apiUrl: pulumi.Output<string>;
    public readonly api: aws.apigatewayv2.Api;
    public readonly name: string;

    constructor(name: string) {
        this.name = name;
        // Create the API Gateway
        this.api = new aws.apigatewayv2.Api(`${name}-api`, {
            protocolType: "HTTP",
            name: `${name}-api`,
        });

        // Export the API URL
        this.apiUrl = pulumi.interpolate`${this.api.apiEndpoint}`;
    }

    // Method to add an integration to the API Gateway
    addIntegration(lambdaFunctionArn: pulumi.Input<string>) {
        // Create the Lambda integration
        const lambdaIntegration = new aws.apigatewayv2.Integration(`${this.name}-integration`, {
            apiId: this.api.id,
            integrationType: "AWS_PROXY",
            integrationUri: lambdaFunctionArn,
            integrationMethod: "ANY",
            payloadFormatVersion: "2.0",
        });

        // Create a wildcard route
        const route = new aws.apigatewayv2.Route(`${this.name}-route`, {
            apiId: this.api.id,
            routeKey: "$default",
            target: pulumi.interpolate`integrations/${lambdaIntegration.id}`,
        });

        // Add permissions for API Gateway to invoke the Lambda function
        const lambdaPermission = new aws.lambda.Permission(`${this.name}-lambda-permission`, {
            action: "lambda:InvokeFunction",
            function: lambdaFunctionArn,
            principal: "apigateway.amazonaws.com",
            sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`,
        });
    }

    deployStage(stageName: string) {
        // Create a new stage for the API
        return new aws.apigatewayv2.Stage(`${this.name}-${stageName}`, {
            apiId: this.api.id,
            name: stageName,
            autoDeploy: true,
        });
    }
}

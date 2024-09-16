import * as pulumi from "@pulumi/pulumi";
import {PhpFpmFunction} from "../function";
import {FunctionHttpApi} from "../api_gateway/FunctionApi";
import {LambdaRole} from "./LambdaRole";
import {PhpOctaneFunction} from "../function/PhpOctaneFunction";

export class WebApp {
    public readonly httpApi: FunctionHttpApi;
    public readonly phpFunction: PhpFpmFunction | PhpOctaneFunction;
    public readonly name: string;
    public readonly useOctane: boolean;

    constructor(
        name: string,
        code: pulumi.asset.FileArchive,
        lambdaRole: LambdaRole,
        environment: Record<string, any>,
        useOctane: boolean = false,
        subnetIds?: string[],
        securityGroupIds?: string[])
    {
        this.name = name;
        this.useOctane = useOctane;

        // Create an HTTP API
        this.httpApi = new FunctionHttpApi("laravel-test");

        // Create APP_URL env if it isnt passed in
        if (!environment.hasOwnProperty('APP_URL')) {
            environment.APP_URL = this.httpApi.apiUrl;
        }

        // Create a Lambda function
        if (this.useOctane) {
            this.phpFunction = new PhpOctaneFunction(
                this.name,
                code,
                lambdaRole.lambdaRole.arn,
                environment,
                subnetIds,
                securityGroupIds
                );
        } else {
            this.phpFunction = new PhpFpmFunction(
                this.name,
                code,
                lambdaRole.lambdaRole.arn,
                "public/index.php",
                environment,
                subnetIds,
                securityGroupIds);
        }


        // Create lambda integration with the API Gateway
        this.httpApi.addIntegration(this.phpFunction.lambda.arn);
        // Deploy the stage
        this.httpApi.deployStage(pulumi.getStack());
    }
}

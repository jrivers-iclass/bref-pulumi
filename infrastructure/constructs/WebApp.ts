import * as pulumi from "@pulumi/pulumi";
import {PhpFpmFunction} from "../function";
import {FunctionHttpApi} from "../api_gateway/FunctionApi";
import {LambdaRole} from "./LambdaRole";

export class WebApp {
    public readonly httpApi: FunctionHttpApi;
    public readonly phpFpmFunction: PhpFpmFunction;
    public readonly name: string;

    constructor(name: string, code: pulumi.asset.FileArchive, lambdaRole: LambdaRole, environment: {}) {
        this.name = name;

        // Create an HTTP API
        this.httpApi = new FunctionHttpApi("laravel-test");

        // Create a Lambda function
        this.phpFpmFunction = new PhpFpmFunction(
            this.name,
            code,
            lambdaRole.lambdaRole.arn,
            "public/index.php",
            environment);

        // Create lambda integration with the API Gateway
        this.httpApi.addIntegration(this.phpFpmFunction.lambda.arn);
        // Deploy the stage
        this.httpApi.deployStage(pulumi.getStack());
    }
}

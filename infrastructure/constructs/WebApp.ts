import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {PhpFpmFunction} from "../function/PhpFpmFunction";
import {FunctionHttpApi} from "../api_gateway/FunctionApi";

export class WebApp {
    public readonly httpApi: FunctionHttpApi;
    public readonly bucket: aws.s3.Bucket;
    public readonly phpFpmFunction: PhpFpmFunction

    constructor(code: pulumi.asset.FileArchive ,s3Bucket: aws.s3.Bucket, lambdaRole: aws.iam.Role) {
        this.bucket = s3Bucket
        // Create an HTTP API
        this.httpApi = new FunctionHttpApi("laravel-test");
        // Create a Lambda function
        this.phpFpmFunction = new PhpFpmFunction(
            "laravel-test",
            code,
            s3Bucket.id,
            lambdaRole.arn,
            "public/index.php", {
                APP_URL: pulumi.interpolate`${this.httpApi.apiUrl}`,
            });
        // Create lambda integration with the API Gateway
        this.httpApi.addIntegration(this.phpFpmFunction.lambda.arn);
        // Deploy the stage
        this.httpApi.deployStage(pulumi.getStack());
    }
}

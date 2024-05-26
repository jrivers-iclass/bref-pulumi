import * as pulumi from "@pulumi/pulumi";
import {PhpFpmFunction} from "../function/PhpFpmFunction";
import {PhpConsoleFunction} from "../function/PhpConsoleFunction";
import {LambdaRole} from "./LambdaRole";

export class ConsoleApp {
    public readonly phpFpmFunction: PhpFpmFunction;
    public readonly name: string;
    public readonly lambdaRole: LambdaRole;

    constructor(name: string, code: pulumi.asset.FileArchive , lambdaRole: LambdaRole, environment: {}) {
        this.name = name;
        this.lambdaRole = lambdaRole;

        // Create a Lambda function
        this.phpFpmFunction = new PhpConsoleFunction(
            this.name,
            code,
            this.lambdaRole.lambdaRole.arn,
            "artisan",
            environment
        );
    }
}

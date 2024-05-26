import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {Output} from "@pulumi/pulumi";
import {FileArchive} from "@pulumi/pulumi/asset";

const functionDefaults = {
    memorySize: 1024,
    phpVersion: "8.2",
    architecture: "x86_64"
};

function phpLayer(phpVersion: string) {
    return `arn:aws:lambda:us-east-1:534081306603:layer:php-${phpVersion}:68`;
}

function consoleLayer() {
    return `arn:aws:lambda:us-east-1:534081306603:layer:console:78`;
}

export class PhpConsoleFunction {
    name: string;
    roleArn: Output<string>;
    handler: string;
    environment?: { [key: string]: string };
    layers?: string[];
    timeout: number;
    memorySize: number;
    code: pulumi.asset.FileArchive
    lambda: aws.lambda.Function;

    constructor(name: string,
                code: FileArchive,
                roleArn: Output<string>,
                handler: string,
                environment?: {},
                layers?: string[],
                timeout: number = 28,
                memorySize: number = functionDefaults.memorySize) {
        this.name = name;
        this.roleArn = roleArn;
        this.handler = handler;
        this.environment = environment;
        this.layers = layers;
        this.timeout = timeout;
        this.memorySize = memorySize;
        this.code = code;

        const phpVersion = functionDefaults.phpVersion;
        const architecture = functionDefaults.architecture;
        const phpLayerArn = phpLayer(phpVersion.replace(".", ""));
        const consoleLayerArn = consoleLayer();

        this.lambda = new aws.lambda.Function(this.name, {
            code: this.code,
            role: this.roleArn,
            handler: this.handler,
            runtime: aws.lambda.Runtime.CustomAL2,
            architectures: [architecture],
            environment: this.environment ? { variables: this.environment } : undefined,
            layers: [phpLayerArn, consoleLayerArn, ...(this.layers || [])],
            timeout: this.timeout,
            memorySize: this.memorySize
        });
    }
}

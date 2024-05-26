import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {ID, Output} from "@pulumi/pulumi";

const functionDefaults = {
    memorySize: 1024,
    phpVersion: "8.2",
    architecture: "x86_64"
};

function fpmLayer(phpVersion: string) {
    return `arn:aws:lambda:us-east-1:534081306603:layer:php-${phpVersion}-fpm:68`;
}

export class PhpFpmFunction {
    name: string;
    s3Bucket: Output<ID>;
    s3Key: string;
    roleArn: Output<string>;
    handler: string;
    environment?: { [key: string]: string };
    layers?: string[];
    timeout: number;
    memorySize: number;

    constructor(name: string, s3Bucket: Output<ID>, s3Key: string, roleArn: Output<string>, handler: string, environment?: {
        [p: string]: string
    }, layers?: string[], timeout: number = 28, memorySize: number = functionDefaults.memorySize) {
        this.name = name;
        this.s3Bucket = s3Bucket;
        this.s3Key = s3Key;
        this.roleArn = roleArn;
        this.handler = handler;
        this.environment = environment;
        this.layers = layers;
        this.timeout = timeout;
        this.memorySize = memorySize;
    }

    create() {
        const phpVersion = functionDefaults.phpVersion;
        const architecture = functionDefaults.architecture;
        const fpmLayerArn = fpmLayer(phpVersion.replace(".", ""));

        return new aws.lambda.Function(this.name, {
            code: new pulumi.asset.FileArchive(`../laravel`),
            role: this.roleArn,
            handler: this.handler,
            runtime: aws.lambda.Runtime.CustomAL2,
            environment: this.environment ? { variables: this.environment } : undefined,
            layers: [fpmLayerArn, ...(this.layers || [])],
            timeout: this.timeout,
            memorySize: this.memorySize
        });
    }
}

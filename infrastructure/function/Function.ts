import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {Output} from "@pulumi/pulumi";
import {FileArchive} from "@pulumi/pulumi/asset";

export const functionDefaults = {
    memorySize: 1024,
    phpVersion: "8.2",
    architecture: "x86_64"
};

export class Function {
    name: string;
    roleArn: Output<string>;
    handler: string;
    environment?: { [key: string]: string };
    layers?: string[];
    timeout: number;
    memorySize: number;
    code: pulumi.asset.FileArchive;
    lambda: aws.lambda.Function;
    brefLayers: {};
    subnetIds: string[];
    securityGroupIds: string[];

    constructor(name: string,
                code: FileArchive,
                roleArn: Output<string>,
                handler: string,
                environment?: {},
                phpVersion: string = functionDefaults.phpVersion,
                brefLayers: string[] = [],
                layers?: string[],
                timeout: number = 28,
                memorySize: number = functionDefaults.memorySize,
                subnetIds: string[] = [],
                securityGroupIds: string[] = [])
    {
        this.name = name;
        this.roleArn = roleArn;
        this.handler = handler;
        this.environment = environment;
        this.layers = layers;
        this.timeout = timeout;
        this.memorySize = memorySize;
        this.code = code;
        this.subnetIds = [];
        this.securityGroupIds = [];
        const architecture = functionDefaults.architecture;
        this.brefLayers = {
            php: this.phpLayer(phpVersion),
            console: this.consoleLayer(),
            fpm: this.fpmLayer(phpVersion)
        }

        type brefLayerKey = keyof typeof this.brefLayers;
        for (const layer of brefLayers) {
            if (!this.layers) {
                this.layers = [];
            }
            if (!(layer in this.brefLayers)){
                throw new Error(`Layer ${layer} not found in brefLayers`);
            }

            let layerKey = layer as brefLayerKey;
            this.layers.push(this.brefLayers[layerKey]);
        }

        const lambdaConfig: aws.lambda.FunctionArgs = {
            code: code,
            role: roleArn,
            handler: handler,
            runtime: aws.lambda.Runtime.CustomAL2,
            architectures: [architecture],
            environment: { variables: environment },
            layers: [...(this.layers || [])],
            timeout: timeout,
            memorySize: memorySize,
        };

        if (subnetIds && subnetIds.length > 0 && securityGroupIds && securityGroupIds.length > 0) {
            lambdaConfig.vpcConfig = {
                subnetIds: subnetIds,
                securityGroupIds: securityGroupIds,
            };
        }

        this.lambda = new aws.lambda.Function(this.name, lambdaConfig);
    }

    private phpLayer(phpVersion: string) {
        return `arn:aws:lambda:us-east-1:534081306603:layer:php-${phpVersion.replace('.', '')}:68`;
    }

    private consoleLayer() {
        return `arn:aws:lambda:us-east-1:534081306603:layer:console:78`;
    }

    private fpmLayer(phpVersion: string) {
        return `arn:aws:lambda:us-east-1:534081306603:layer:php-${phpVersion.replace('.', '')}-fpm:68`;
    }
}

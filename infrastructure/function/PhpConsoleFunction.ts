import {Output} from "@pulumi/pulumi";
import {FileArchive} from "@pulumi/pulumi/asset";
import {Function, functionDefaults} from "./Function";

export class PhpConsoleFunction extends Function {
    constructor(name: string,
                code: FileArchive,
                roleArn: Output<string>,
                handler: string,
                environment?: {},
                subnetIds?: string[],
                securityGroupIds?: string[],
                layers?: string[],
                timeout: number = 28,
                memorySize: number = functionDefaults.memorySize) {
        super(name, code, roleArn, handler, environment, functionDefaults.phpVersion, ["php", "console"], layers, timeout, memorySize, subnetIds, securityGroupIds);
    }
}

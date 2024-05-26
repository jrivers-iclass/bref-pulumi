import {Output} from "@pulumi/pulumi";
import {FileArchive} from "@pulumi/pulumi/asset";
import {Function, functionDefaults} from "./Function";

export class PhpOctaneFunction extends Function {
    constructor(name: string,
                code: FileArchive,
                roleArn: Output<string>,
                environment?: {},
                layers?: string[],
                timeout: number = 28,
                memorySize: number = functionDefaults.memorySize) {
        super(name, code, roleArn, "Bref\\LaravelBridge\\Http\\OctaneHandler", environment, functionDefaults.phpVersion, ["php"], layers, timeout, memorySize);
    }
}

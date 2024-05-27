import * as awsx from "@pulumi/awsx";
import {VpcArgs} from "@pulumi/awsx/ec2/vpc";

export class SimpleVpc {
    public readonly name: string;
    public readonly vpc: awsx.ec2.Vpc;
    constructor(
        name: string,
        publicSubnet: boolean,
        privateSubnet: boolean,
        natGateway: boolean,
        numberOfAvailabilityZones: number = 2,
        cidrBlock: string = "") {
        this.name = name;

        const subnetSpecs = []
        if (publicSubnet) {
            subnetSpecs.push({ type: awsx.ec2.SubnetType.Public, cidrMask: 24 });
        }
        if (privateSubnet) {
            subnetSpecs.push({ type: awsx.ec2.SubnetType.Private, cidrMask: 24 });
        }

        const args: VpcArgs = {
            cidrBlock: cidrBlock,
            numberOfAvailabilityZones: numberOfAvailabilityZones,
            subnetStrategy: "Auto",
            subnetSpecs: subnetSpecs,
        }

        if (natGateway) {
            args["natGateways"] = {
                strategy: awsx.ec2.NatGatewayStrategy.Single,
            };
        }

        this.vpc = new awsx.ec2.Vpc("lambda-test-vpc", args);
    }
}

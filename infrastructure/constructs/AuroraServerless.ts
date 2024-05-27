import * as aws from "@pulumi/aws";
import {SimpleVpc} from "../vpc/SimpleVpc";
import {AuroraSecurityGroup} from "../vpc/AuroraSecurityGroup";
import {Output} from "@pulumi/pulumi";

export class AuroraServerless {
    public readonly auroraCluster: aws.rds.Cluster;
    public readonly secretArn: Output<string>;
    public readonly endpoint: Output<string>;
    public readonly readerEndpoint: Output<string>;
    public readonly port: Output<number>;
    public readonly username: Output<string>;

    constructor(
        name: string,
        vpc: SimpleVpc,
        securityGroup: AuroraSecurityGroup,
        numberOfReaders: number = 1,
        minCapacity: number = 0.5,
        maxCapacity: number = 1
    ) {
        this.auroraCluster = new aws.rds.Cluster(name, {
            clusterIdentifier: name,
            engine: aws.rds.EngineType.AuroraMysql,
            engineVersion: "8.0.mysql_aurora.3.06.0",
            engineMode: aws.rds.EngineMode.Provisioned,
            databaseName: "laravelTest",
            masterUsername: "admin",
            manageMasterUserPassword: true,
            serverlessv2ScalingConfiguration: {
                maxCapacity: maxCapacity,
                minCapacity: minCapacity,
            },
            skipFinalSnapshot: true,
            vpcSecurityGroupIds: [securityGroup.securityGroup.id],
            dbSubnetGroupName: new aws.rds.SubnetGroup("auroraSubnetGroup", {
                subnetIds: vpc.vpc.privateSubnetIds,
                name: "aurora-subnet-group",
            }).name,
        });

        for( let i = 0; i < numberOfReaders; i++) {
            new aws.rds.ClusterInstance("laravel-test-instance", {
                identifier: `${name}-${i}`,
                clusterIdentifier: this.auroraCluster.id,
                instanceClass: "db.serverless",
                engine: this.auroraCluster.engine.apply(engine => engine as aws.rds.EngineType),
                dbSubnetGroupName: this.auroraCluster.dbSubnetGroupName,
                publiclyAccessible: false,
            });
        }

        this.secretArn = this.auroraCluster.masterUserSecrets.apply(
            secrets => secrets[0].secretArn)
        this.endpoint = this.auroraCluster.endpoint;
        this.readerEndpoint = this.auroraCluster.readerEndpoint;
        this.port = this.auroraCluster.port;
        this.username = this.auroraCluster.masterUsername;
    }
}

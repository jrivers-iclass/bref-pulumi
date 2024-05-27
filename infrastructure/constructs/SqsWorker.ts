import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {LambdaRole} from "./LambdaRole";
import {Function} from "../function";

export class SqsWorker {
    public readonly phpFunction: Function;
    public readonly name: string;
    public readonly queue: aws.sqs.Queue;
    public readonly visibilityTimeoutSeconds: number = 30;
    public readonly messageRetentionSeconds: number = 86400;
    public readonly delaySeconds: number = 0;
    public readonly receiveWaitTimeSeconds: number = 0;
    public readonly batchSize: number = 1;
    constructor(
        name: string,
        code: pulumi.asset.FileArchive,
        lambdaRole: LambdaRole,
        environment: {},
        subnetIds?: string[],
        securityGroupIds?: string[],
        batchSize: number = 1,
        visibilityTimeoutSeconds: number = 30,
        messageRetentionSeconds: number = 86400,
        delaySeconds: number = 0,
        receiveWaitTimeSeconds: number = 0) {
    {
        this.name = name;
        this.visibilityTimeoutSeconds = visibilityTimeoutSeconds;
        this.messageRetentionSeconds = messageRetentionSeconds;
        this.delaySeconds = delaySeconds;
        this.receiveWaitTimeSeconds = receiveWaitTimeSeconds;
        this.batchSize = batchSize;

        this.queue = new aws.sqs.Queue(`${name}-queue`, {
            name: `${name}-queue`,
            visibilityTimeoutSeconds: this.visibilityTimeoutSeconds,
            messageRetentionSeconds: this.messageRetentionSeconds,
            delaySeconds: this.delaySeconds,
            receiveWaitTimeSeconds: this.receiveWaitTimeSeconds,
        });

        this.phpFunction = new Function(
            this.name,
            code,
            lambdaRole.lambdaRole.arn,
            "Bref\\LaravelBridge\\Queue\\QueueHandler",
            environment,
            "8.2",
            ["php"],
            undefined,
            undefined,
            undefined,
            subnetIds,
            securityGroupIds
        );

        new aws.lambda.EventSourceMapping("eventSourceMapping", {
            eventSourceArn: this.queue.arn,
            functionName: this.phpFunction.lambda.arn,
            batchSize: this.batchSize,
        });

        lambdaRole.addPolicy(`${name}-queue-policy`, new aws.iam.Policy(`${name}-queue-policy`, {
            policy: this.queue.arn.apply(arn => JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes",
                        "sqs:GetQueueUrl",
                    ],
                    Resource: arn,
                }],
            })),
        }));
        }
    }
}

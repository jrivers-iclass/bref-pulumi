import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class S3BucketPolicy {
    public readonly bucketPolicy: aws.iam.Policy

    constructor(s3Bucket: aws.s3.Bucket) {
        this.bucketPolicy = new aws.iam.Policy("bucketPolicy", {
            policy: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    Resource: [
                        pulumi.interpolate`${s3Bucket.arn}/*`,
                        pulumi.interpolate`${s3Bucket.arn}`
                    ]
                }]
            }
        });
    }
}

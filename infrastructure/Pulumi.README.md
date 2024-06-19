# Stack README
- [Stack README](#stack-readme)
- [Overview](#overview)
- [Outputs](#outputs)

## Overview
This stack is responsible for creating and example Bref stack using Pulumi! 

## Getting Started
To get started you will need to do the following:
- Install Pulumi
- Install the AWS CLI
- Configure your AWS CLI
- Run `composer install` in the `laravel` directory
- Run `npm install` in the `infrastructure` directory
- Run `pulumi up` in the `infrastructure` directory
- Review and confirm the changes
- The outputs will be displayed in the terminal including all the necessary information to access the application

## Outputs
The following outputs are available:
- The URL to access the application `${outputs.apiUrl}`
- The endpoint to access the Aurora database `${outputs.auroraClusterEndpoint}`
- The name of the S3 bucket `${outputs.bucketName}`
- The URL to access the SQS queue `${outputs.queueUrl}` 
- Octane Enabled: `${outputs.useOctane}`


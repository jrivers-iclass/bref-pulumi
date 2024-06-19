A simple bref app using pulumi.

# Installation
```bash
pulumi new https://github.com/jrivers-iclass/bref-pulumi/tree/main
```
OR

[![Deploy with Pulumi](https://get.pulumi.com/new/button.svg)](https://app.pulumi.com/new?template=https://github.com/jrivers-iclass/bref-pulumi/tree/main)

Once the stack is created you can run:
- `composer install` from the laravel directory
- `pulumi up` from the root directory to deploy the stack


Future Plans
- Add support for ALB
- Add support for custom authorizers
- Add support for custom domains
- Add support for ECS cluster workers (fargate)
- Add support for postgres
- Add support for redis
- Add support for EventBridge

# Example: Deploy Nginx web server to AWS ECS with CDK

This is an example of deploying an Nginx web server to AWS ECS using the AWS Cloud Development Kit (CDK).

This example will deploy the following resources to AWS:
- A VPC with public, private and isolated subnets.
- A public Route53 hosted zone.
- An ECS cluster, with EC2 capacity provider and autoscaling capabilities.
- An ECS service to run the Nginx web server, with autoscaling capabilities.
- A public Application Load Balancer to expose the Nginx service to the internet, secured with a TLS certificate.

# Repository structure

- `/app`: Nginx web server application configuration and container image
- `/infra/app`: CDK app to deploy the Nginx web server to an existing ECS cluster
- `/infra/platform/ecs`: CDK app to deploy an ECS cluster
- `/infra/platform/network`: CDK app to deploy shared networking infrastructure such as VPC, Route53, etc.

In practice, shared infrastructure components such as networking layer and ECS clusters would be managed separately from the application, with their own lifecycles and deployment pipelines. They are included in this example for completeness.

# How to deploy

## Pre-requisites

Ensure below tools, with correct versions, are installed:

- Node.js v20.11.1
- AWS CLI v2.15.32
- AWS CDK v2.133.0
- Docker

> Use a Developemt Container with the provided `.devcontainer` configuration to avoid having to install these tools manually.

## Steps

This example can be deployed by deploying the CDK applications in the following order:

- `/infra/platform/network`
- `/infra/platform/ecs`
- `/infra/app`

For each CDK application, navigate to its directory and run the following commands:

```bash
cdk deploy --require-approval never
```

> This example assumes you have the necessary permissions to create the required resources in your AWS account.

## Cleanup

To cleanup the resources created by this example, destroy the CDK applications in the following order:

- `/infra/app`
- `/infra/platform/ecs`
- `/infra/platform/network`

For each CDK application, navigate to its directory and run the following commands:

```bash
cdk destroy
```

# License

This example is licensed under the MIT No Attribution License (MIT-0). See the `LICENSE` file for more information.

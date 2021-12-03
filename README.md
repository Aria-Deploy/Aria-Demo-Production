# Aria Demo Production Environment for AWS CDK

Based on the repository for an article on
[bobbyhadz.com](https://bobbyhadz.com/blog/aws-cdk-application-load-balancer). Thanks Bobby!

## How to Use

1. Clone the repository

2. Install the dependencies

```bash
npm install
```

### (optional). If you wish to use your own ssh key pair with the demo production environment. 
Go to `./lib/cdk-aria-demo-production-stack.ts`, search for `keyName`, uncomment the appropriate line in the `instance` object declaration, and enter the string for your ssh key. Then rebuild the application by entering `npm run build`.

3. Create the CDK stack

```bash
npx cdk deploy \
  --outputs-file ./cdk-outputs.json
```

4. Open the AWS CloudFormation Console and the stack should be created in your
   default region

5. Cleanup

```bash
npx cdk destroy
```

## For Use with Aria Deploy

1. Deploy the production environment according to the directions above.

2. Go to the `artifacts` folder.

3. Copy the files `demoBaseline.tar`, `demoCanary.tar`, `docker-compose-baseline.yml`, and `docker-compose-canary.yml` to the top level of the Aria-Deploy directory.

4. You will have service discovery for node_exporter enabled by default. To enable service discovery for the dockerized web server apps provided, use the Aria-Deploy form to add a prometheus exporter on port 8081 (also choose a descriptive job name, such as 'web_server'). 

5. Select the files you copied into the top of level of Aria in step 3 as your app Docker images and docker-compose files.

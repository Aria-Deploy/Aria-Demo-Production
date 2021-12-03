# Aria Demo Production Environment for AWS CDK

Based on the repository for an article on
[bobbyhadz.com](https://bobbyhadz.com/blog/aws-cdk-application-load-balancer). Thanks Bobby!

## How to Use

1. Clone the repository

2. Install the dependencies

```bash
npm install
```

3. Create a `.env` file in the project root directory. Add the name of an AWS SSH key.

```
SSH_KEY_PAIR='YOUR_KEY_PAIR_Name'
```

4. Create the CDK stack

```bash
npx cdk deploy \
  --outputs-file ./cdk-outputs.json
```

5. Open the AWS CloudFormation Console and the stack should be created in your
   default region

6. Cleanup

```bash
npx cdk destroy
```

## For Use with Aria Deploy

1. Deploy the production environment according to the directions above.

2. Go to the `artifacts` folder.

3. Copy the files `demoBaseline.tar`, `demoCanary.tar`, `docker-compose-baseline.yml`, and `docker-compose-canary.yml` to the top level of the Aria-Deploy directory.

4. You will have service discovery for node_exporter enabled by default. To enable service discovery for the dockerized web server apps provided, use the Aria-Deploy form to add a prometheus exporter on port 8081 (also choose a descriptive job name, such as 'web_server'). 

5. Select the files you copied into the top of level of Aria in step 3 as your app Docker images and docker-compose files.

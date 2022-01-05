# Aria Demo Production Environment for AWS CDK

Based on the repository for an article on
[bobbyhadz.com](https://bobbyhadz.com/blog/aws-cdk-application-load-balancer). Thanks Bobby!

## How to Use

1. Clone the repository.

2. Install the dependencies.

> ```bash
> npm install
> ```

3. (OPTIONAL) To use an AWS SSH key, create a `.env` file in the Aria-Demo-Production root directory, and add the name of an AWS SSH key.

> ```
> SSH_KEY_PAIR='YOUR_KEY_PAIR'
> ```

4. Create the CDK stack.

> ```bash
> npx cdk deploy
> ```

5. Open the AWS CloudFormation Console and the stack should be created in your
   default region.

6. Once you're done with the demon environment, destroy it with the following commands. *Make sure to destroy any canary deployments associated with the demo environment first!*

> ```bash
> npx cdk destroy
> ```

## For Use with Aria Deploy

1. Deploy the production environment according to the directions above.

2. Go to the `artifacts` folder.

3. Copy the files `demoBaseline.tar`, `demoCanary.tar`, `docker-compose-baseline.yml`, and `docker-compose-canary.yml` to the top level of the Aria-Deploy directory.

4. You will have Prometheus service discovery for `node_exporter` enabled by default. To enable service discovery for the dockerized web server apps provided, use the Aria-Deploy form to add an exporter on port 8081 (also choose a descriptive job name, such as 'web_server'). 

5. Select the files you copied into the top of level of Aria in step 3 as your app Docker images and docker-compose files.


## About the Dockerized Web Apps
The production, baseline, and canary dockerized apps included in this repository are based off the example presented in [this article](https://sysdig.com/blog/golden-signals-kubernetes/).

There are four routes of interest:
- `/`
- `/{anything}`
- `/sayhello/{name}`
  - These three routes return a webpage after a random delay. 
  - There is no difference between the Production and Basline app other than page color and the page message; they exhibit the same delay behavior.
  - The Canary app exhibits shorter delays.
  - The `/sayhello/{name}` route displays `{name}` as part of the page.
- `/metrics`
  - This route is only accessible for the Baseline and Canary apps via port 8081. It is the exposed metrics path for Prometheus.

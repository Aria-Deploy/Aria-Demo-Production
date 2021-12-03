import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';
import {Asset} from '@aws-cdk/aws-s3-assets';
import {readFileSync} from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

export class AriaDemoProductionStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // vpc
    const vpc = new ec2.Vpc(this, 'AriaDemoProd-vpc', {natGateways: 1});

    // application load balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'AriaDemoProd-alb', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('AriaDemoProd-Listener', {
      port: 80,
      open: true,
    });

    // 👇 create security group for ec2 instances
    const webserverSG = new ec2.SecurityGroup(
      this,
      'AriaDemoProd-webserver-sg',
      {
        vpc,
        allowAllOutbound: true,
      },
    );

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anywhere',
    );

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow http access from anywhere',
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.log('env: ', props.env);
    console.log('ssh: ', process.env.SSH_KEY_PAIR);

    const instance = {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      minCapacity: 1,
      maxCapacity: 1,
      keyName: process.env.SSH_KEY_PAIR,
      securityGroup: webserverSG,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    };

    const asg = new autoscaling.AutoScalingGroup(
      this,
      'AriaDemoProd-asg',
      instance,
    );

    const productionImageAsset = new Asset(
      this,
      'AriaDemoProductionImageAsset',
      {
        path: './artifacts/demoProduction.tar',
      },
    );
    productionImageAsset.grantRead(asg.grantPrincipal);
    asg.userData.addS3DownloadCommand({
      bucket: productionImageAsset.bucket,
      bucketKey: productionImageAsset.s3ObjectKey,
      localFile: '/home/ec2-user/demoProduction.tar',
    });

    const productionComposeAsset = new Asset(
      this,
      'AriaDemoProductionComposeAsset',
      {
        path: './scripts/docker-compose-prod',
      },
    );
    productionComposeAsset.grantRead(asg.grantPrincipal);
    asg.userData.addS3DownloadCommand({
      bucket: productionComposeAsset.bucket,
      bucketKey: productionComposeAsset.s3ObjectKey,
      localFile: '/home/ec2-user/docker-compose.yml',
    });

    // ec2 instance user data
    const productionSetupScript = readFileSync(
      './scripts/productionSetup.sh',
      'utf8',
    );
    asg.addUserData(productionSetupScript);

    // define target groups
    const target = new elbv2.ApplicationTargetGroup(
      this,
      'AriaDemoProd-target',
      {
        vpc,
        port: 80,
        targets: [asg],
      },
    );

    listener.addAction('default', {
      action: elbv2.ListenerAction.weightedForward([
        {
          targetGroup: target,
          weight: 1,
        },
      ]),
    });

    new cdk.CfnOutput(this, 'AriaDemoProd-albDNS', {
      value: `http://${alb.loadBalancerDnsName}`,
    });
  }
}

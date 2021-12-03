"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AriaDemoProductionStack = void 0;
const autoscaling = __importStar(require("@aws-cdk/aws-autoscaling"));
const ec2 = __importStar(require("@aws-cdk/aws-ec2"));
const elbv2 = __importStar(require("@aws-cdk/aws-elasticloadbalancingv2"));
const cdk = __importStar(require("@aws-cdk/core"));
const aws_s3_assets_1 = require("@aws-cdk/aws-s3-assets");
const fs_1 = require("fs");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class AriaDemoProductionStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // vpc
        const vpc = new ec2.Vpc(this, 'AriaDemoProd-vpc', { natGateways: 1 });
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
        const webserverSG = new ec2.SecurityGroup(this, 'AriaDemoProd-webserver-sg', {
            vpc,
            allowAllOutbound: true,
        });
        webserverSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow SSH access from anywhere');
        webserverSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow http access from anywhere');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        console.log('env: ', props.env);
        console.log('ssh: ', process.env.SSH_KEY_PAIR);
        const instance = {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
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
        const asg = new autoscaling.AutoScalingGroup(this, 'AriaDemoProd-asg', instance);
        const productionImageAsset = new aws_s3_assets_1.Asset(this, 'AriaDemoProductionImageAsset', {
            path: './artifacts/demoProduction.tar',
        });
        productionImageAsset.grantRead(asg.grantPrincipal);
        asg.userData.addS3DownloadCommand({
            bucket: productionImageAsset.bucket,
            bucketKey: productionImageAsset.s3ObjectKey,
            localFile: '/home/ec2-user/demoProduction.tar',
        });
        const productionComposeAsset = new aws_s3_assets_1.Asset(this, 'AriaDemoProductionComposeAsset', {
            path: './scripts/docker-compose-prod',
        });
        productionComposeAsset.grantRead(asg.grantPrincipal);
        asg.userData.addS3DownloadCommand({
            bucket: productionComposeAsset.bucket,
            bucketKey: productionComposeAsset.s3ObjectKey,
            localFile: '/home/ec2-user/docker-compose.yml',
        });
        // ec2 instance user data
        const productionSetupScript = fs_1.readFileSync('./scripts/productionSetup.sh', 'utf8');
        asg.addUserData(productionSetupScript);
        // define target groups
        const target = new elbv2.ApplicationTargetGroup(this, 'AriaDemoProd-target', {
            vpc,
            port: 80,
            targets: [asg],
        });
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
exports.AriaDemoProductionStack = AriaDemoProductionStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWFyaWEtZGVtby1wcm9kdWN0aW9uLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLWFyaWEtZGVtby1wcm9kdWN0aW9uLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0Q7QUFDeEQsc0RBQXdDO0FBQ3hDLDJFQUE2RDtBQUM3RCxtREFBcUM7QUFDckMsMERBQTZDO0FBQzdDLDJCQUFnQztBQUNoQywrQ0FBaUM7QUFFakMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWhCLE1BQWEsdUJBQXdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDcEQsWUFBWSxLQUFjLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU07UUFDTixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEVBQUMsV0FBVyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUM7UUFFcEUsNEJBQTRCO1FBQzVCLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN0RSxHQUFHO1lBQ0gsY0FBYyxFQUFFLElBQUk7U0FDckIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsRUFBRTtZQUN4RCxJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQyxDQUFDO1FBRUgsNkNBQTZDO1FBQzdDLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FDdkMsSUFBSSxFQUNKLDJCQUEyQixFQUMzQjtZQUNFLEdBQUc7WUFDSCxnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQ0YsQ0FBQztRQUVGLFdB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NUIsTUFBTSxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO2dCQUMzQztvQkFDRSxXQUFXLEVBQUUsTUFBTTtvQkFDbkIsTUFBTSxFQUFFLENBQUM7aUJBQ1Y7YUFDRixDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUM3QyxLQUFLLEVBQUUsVUFBVSxHQUFHLENBQUMsbUJBQW1CLEVBQUU7U0FDM0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaElELDBEQWdJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF1dG9zY2FsaW5nIGZyb20gJ0Bhd3MtY2RrL2F3cy1hdXRvc2NhbGluZyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnQGF3cy1jZGsvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICdAYXdzLWNkay9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQge0Fzc2V0fSBmcm9tICdAYXdzLWNkay9hd3MtczMtYXNzZXRzJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBkb3RlbnYgZnJvbSAnZG90ZW52JztcblxuZG90ZW52LmNvbmZpZygpO1xuXG5leHBvcnQgY2xhc3MgQXJpYURlbW9Qcm9kdWN0aW9uU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gdnBjXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgJ0FyaWFEZW1vUHJvZC12cGMnLCB7bmF0R2F0ZXdheXM6IDF9KTtcblxuICAgIC8vIGFwcGxpY2F0aW9uIGxvYWQgYmFsYW5jZXJcbiAgICBjb25zdCBhbGIgPSBuZXcgZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXIodGhpcywgJ0FyaWFEZW1vUHJvZC1hbGInLCB7XG4gICAgICB2cGMsXG4gICAgICBpbnRlcm5ldEZhY2luZzogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3RlbmVyID0gYWxiLmFkZExpc3RlbmVyKCdBcmlhRGVtb1Byb2QtTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA4MCxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyDwn5GHIGNyZWF0ZSBzZWN1cml0eSBncm91cCBmb3IgZWMyIGluc3RhbmNlc1xuICAgIGNvbnN0IHdlYnNlcnZlclNHID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2Qtd2Vic2VydmVyLXNnJyxcbiAgICAgIHtcbiAgICAgICAgdnBjLFxuICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgd2Vic2VydmVyU0cuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC50Y3AoMjIpLFxuICAgICAgJ2FsbG93IFNTSCBhY2Nlc3MgZnJvbSBhbnl3aGVyZScsXG4gICAgKTtcblxuICAgIHdlYnNlcnZlclNHLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdhbGxvdyBodHRwIGFjY2VzcyBmcm9tIGFueXdoZXJlJyxcbiAgICApO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtY29tbWVudFxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zb2xlLmxvZygnZW52OiAnLCBwcm9wcy5lbnYpO1xuICAgIGNvbnNvbGUubG9nKCdzc2g6ICcsIHByb2Nlc3MuZW52LlNTSF9LRVlfUEFJUik7XG5cbiAgICBjb25zdCBpbnN0YW5jZSA9IHtcbiAgICAgIHZwYyxcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihcbiAgICAgICAgZWMyLkluc3RhbmNlQ2xhc3MuVDIsXG4gICAgICAgIGVjMi5JbnN0YW5jZVNpemUuTUlDUk8sXG4gICAgICApLFxuICAgICAgbWFjaGluZUltYWdlOiBuZXcgZWMyLkFtYXpvbkxpbnV4SW1hZ2Uoe1xuICAgICAgICBnZW5lcmF0aW9uOiBlYzIuQW1hem9uTGludXhHZW5lcmF0aW9uLkFNQVpPTl9MSU5VWF8yLFxuICAgICAgfSksXG4gICAgICBtaW5DYXBhY2l0eTogMSxcbiAgICAgIG1heENhcGFjaXR5OiAxLFxuICAgICAga2V5TmFtZTogcHJvY2Vzcy5lbnYuU1NIX0tFWV9QQUlSLFxuICAgICAgc2VjdXJpdHlHcm91cDogd2Vic2VydmVyU0csXG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbnN0IGFzZyA9IG5ldyBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2QtYXNnJyxcbiAgICAgIGluc3RhbmNlLFxuICAgICk7XG5cbiAgICBjb25zdCBwcm9kdWN0aW9uSW1hZ2VBc3NldCA9IG5ldyBBc3NldChcbiAgICAgIHRoaXMsXG4gICAgICAnQXJpYURlbW9Qcm9kdWN0aW9uSW1hZ2VBc3NldCcsXG4gICAgICB7XG4gICAgICAgIHBhdGg6ICcuL2FydGlmYWN0cy9kZW1vUHJvZHVjdGlvbi50YXInLFxuICAgICAgfSxcbiAgICApO1xuICAgIHByb2R1Y3Rpb25JbWFnZUFzc2V0LmdyYW50UmVhZChhc2cuZ3JhbnRQcmluY2lwYWwpO1xuICAgIGFzZy51c2VyRGF0YS5hZGRTM0Rvd25sb2FkQ29tbWFuZCh7XG4gICAgICBidWNrZXQ6IHByb2R1Y3Rpb25JbWFnZUFzc2V0LmJ1Y2tldCxcbiAgICAgIGJ1Y2tldEtleTogcHJvZHVjdGlvbkltYWdlQXNzZXQuczNPYmplY3RLZXksXG4gICAgICBsb2NhbEZpbGU6ICcvaG9tZS9lYzItdXNlci9kZW1vUHJvZHVjdGlvbi50YXInLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcHJvZHVjdGlvbkNvbXBvc2VBc3NldCA9IG5ldyBBc3NldChcbiAgICAgIHRoaXMsXG4gICAgICAnQXJpYURlbW9Qcm9kdWN0aW9uQ29tcG9zZUFzc2V0JyxcbiAgICAgIHtcbiAgICAgICAgcGF0aDogJy4vc2NyaXB0cy9kb2NrZXItY29tcG9zZS1wcm9kJyxcbiAgICAgIH0sXG4gICAgKTtcbiAgICBwcm9kdWN0aW9uQ29tcG9zZUFzc2V0LmdyYW50UmVhZChhc2cuZ3JhbnRQcmluY2lwYWwpO1xuICAgIGFzZy51c2VyRGF0YS5hZGRTM0Rvd25sb2FkQ29tbWFuZCh7XG4gICAgICBidWNrZXQ6IHByb2R1Y3Rpb25Db21wb3NlQXNzZXQuYnVja2V0LFxuICAgICAgYnVja2V0S2V5OiBwcm9kdWN0aW9uQ29tcG9zZUFzc2V0LnMzT2JqZWN0S2V5LFxuICAgICAgbG9jYWxGaWxlOiAnL2hvbWUvZWMyLXVzZXIvZG9ja2VyLWNvbXBvc2UueW1sJyxcbiAgICB9KTtcblxuICAgIC8vIGVjMiBpbnN0YW5jZSB1c2VyIGRhdGFcbiAgICBjb25zdCBwcm9kdWN0aW9uU2V0dXBTY3JpcHQgPSByZWFkRmlsZVN5bmMoXG4gICAgICAnLi9zY3JpcHRzL3Byb2R1Y3Rpb25TZXR1cC5zaCcsXG4gICAgICAndXRmOCcsXG4gICAgKTtcbiAgICBhc2cuYWRkVXNlckRhdGEocHJvZHVjdGlvblNldHVwU2NyaXB0KTtcblxuICAgIC8vIGRlZmluZSB0YXJnZXQgZ3JvdXBzXG4gICAgY29uc3QgdGFyZ2V0ID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ0FyaWFEZW1vUHJvZC10YXJnZXQnLFxuICAgICAge1xuICAgICAgICB2cGMsXG4gICAgICAgIHBvcnQ6IDgwLFxuICAgICAgICB0YXJnZXRzOiBbYXNnXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGxpc3RlbmVyLmFkZEFjdGlvbignZGVmYXVsdCcsIHtcbiAgICAgIGFjdGlvbjogZWxidjIuTGlzdGVuZXJBY3Rpb24ud2VpZ2h0ZWRGb3J3YXJkKFtcbiAgICAgICAge1xuICAgICAgICAgIHRhcmdldEdyb3VwOiB0YXJnZXQsXG4gICAgICAgICAgd2VpZ2h0OiAxLFxuICAgICAgICB9LFxuICAgICAgXSksXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXJpYURlbW9Qcm9kLWFsYkROUycsIHtcbiAgICAgIHZhbHVlOiBgaHR0cDovLyR7YWxiLmxvYWRCYWxhbmNlckRuc05hbWV9YCxcbiAgICB9KTtcbiAgfVxufVxuIl19
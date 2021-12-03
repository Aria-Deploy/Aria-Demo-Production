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
        const instance = {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machineImage: new ec2.AmazonLinuxImage({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            minCapacity: 1,
            maxCapacity: 1,
            keyName: 'ec2-key-pair',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWFyaWEtZGVtby1wcm9kdWN0aW9uLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLWFyaWEtZGVtby1wcm9kdWN0aW9uLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0Q7QUFDeEQsc0RBQXdDO0FBQ3hDLDJFQUE2RDtBQUM3RCxtREFBcUM7QUFDckMsMERBQTZDO0FBQzdDLDJCQUFnQztBQUVoQyxNQUFhLHVCQUF3QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3BELFlBQVksS0FBYyxFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNO1FBQ04sTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRSxFQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDO1FBRXBFLDRCQUE0QjtRQUM1QixNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDdEUsR0FBRztZQUNILGNBQWMsRUFBRSxJQUFJO1NBQ3JCLENBQUMsQ0FBQztRQUVILE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsdUJBQXVCLEVBQUU7WUFDeEQsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUMsQ0FBQztRQUVILDZDQUE2QztRQUM3QyxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQ3ZDLElBQUksRUFDSiwyQkFBMkIsRUFDM0I7WUFDRSxHQUFHO1lBQ0gsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUNGLENBQUM7UUFFRixXQUFXLENBQUMsY0FBYyxDQUN4QixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8s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U0FDM0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM0hELDBEQTJIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF1dG9zY2FsaW5nIGZyb20gJ0Bhd3MtY2RrL2F3cy1hdXRvc2NhbGluZyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnQGF3cy1jZGsvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICdAYXdzLWNkay9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQge0Fzc2V0fSBmcm9tICdAYXdzLWNkay9hd3MtczMtYXNzZXRzJztcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5cbmV4cG9ydCBjbGFzcyBBcmlhRGVtb1Byb2R1Y3Rpb25TdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyB2cGNcbiAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnQXJpYURlbW9Qcm9kLXZwYycsIHtuYXRHYXRld2F5czogMX0pO1xuXG4gICAgLy8gYXBwbGljYXRpb24gbG9hZCBiYWxhbmNlclxuICAgIGNvbnN0IGFsYiA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcih0aGlzLCAnQXJpYURlbW9Qcm9kLWFsYicsIHtcbiAgICAgIHZwYyxcbiAgICAgIGludGVybmV0RmFjaW5nOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbGlzdGVuZXIgPSBhbGIuYWRkTGlzdGVuZXIoJ0FyaWFEZW1vUHJvZC1MaXN0ZW5lcicsIHtcbiAgICAgIHBvcnQ6IDgwLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIPCfkYcgY3JlYXRlIHNlY3VyaXR5IGdyb3VwIGZvciBlYzIgaW5zdGFuY2VzXG4gICAgY29uc3Qgd2Vic2VydmVyU0cgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ0FyaWFEZW1vUHJvZC13ZWJzZXJ2ZXItc2cnLFxuICAgICAge1xuICAgICAgICB2cGMsXG4gICAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICB9LFxuICAgICk7XG5cbiAgICB3ZWJzZXJ2ZXJTRy5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCgyMiksXG4gICAgICAnYWxsb3cgU1NIIGFjY2VzcyBmcm9tIGFueXdoZXJlJyxcbiAgICApO1xuXG4gICAgd2Vic2VydmVyU0cuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC50Y3AoODApLFxuICAgICAgJ2FsbG93IGh0dHAgYWNjZXNzIGZyb20gYW55d2hlcmUnLFxuICAgICk7XG5cbiAgICBjb25zdCBpbnN0YW5jZSA9IHtcbiAgICAgIHZwYyxcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihcbiAgICAgICAgZWMyLkluc3RhbmNlQ2xhc3MuVDIsXG4gICAgICAgIGVjMi5JbnN0YW5jZVNpemUuTUlDUk8sXG4gICAgICApLFxuICAgICAgbWFjaGluZUltYWdlOiBuZXcgZWMyLkFtYXpvbkxpbnV4SW1hZ2Uoe1xuICAgICAgICBnZW5lcmF0aW9uOiBlYzIuQW1hem9uTGludXhHZW5lcmF0aW9uLkFNQVpPTl9MSU5VWF8yLFxuICAgICAgfSksXG4gICAgICBtaW5DYXBhY2l0eTogMSxcbiAgICAgIG1heENhcGFjaXR5OiAxLFxuICAgICAga2V5TmFtZTogJ2VjMi1rZXktcGFpcicsIC8vIHJlcGxhY2UgdGhpcyB3aXRoIHlvdXIgc2VjdXJpdHkga2V5XG4gICAgICBzZWN1cml0eUdyb3VwOiB3ZWJzZXJ2ZXJTRyxcbiAgICAgIHZwY1N1Ym5ldHM6IHtcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uc3QgYXNnID0gbmV3IGF1dG9zY2FsaW5nLkF1dG9TY2FsaW5nR3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ0FyaWFEZW1vUHJvZC1hc2cnLFxuICAgICAgaW5zdGFuY2UsXG4gICAgKTtcblxuICAgIGNvbnN0IHByb2R1Y3Rpb25JbWFnZUFzc2V0ID0gbmV3IEFzc2V0KFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2R1Y3Rpb25JbWFnZUFzc2V0JyxcbiAgICAgIHtcbiAgICAgICAgcGF0aDogJy4vYXJ0aWZhY3RzL2RlbW9Qcm9kdWN0aW9uLnRhcicsXG4gICAgICB9LFxuICAgICk7XG4gICAgcHJvZHVjdGlvbkltYWdlQXNzZXQuZ3JhbnRSZWFkKGFzZy5ncmFudFByaW5jaXBhbCk7XG4gICAgYXNnLnVzZXJEYXRhLmFkZFMzRG93bmxvYWRDb21tYW5kKHtcbiAgICAgIGJ1Y2tldDogcHJvZHVjdGlvbkltYWdlQXNzZXQuYnVja2V0LFxuICAgICAgYnVja2V0S2V5OiBwcm9kdWN0aW9uSW1hZ2VBc3NldC5zM09iamVjdEtleSxcbiAgICAgIGxvY2FsRmlsZTogJy9ob21lL2VjMi11c2VyL2RlbW9Qcm9kdWN0aW9uLnRhcicsXG4gICAgfSk7XG5cbiAgICBjb25zdCBwcm9kdWN0aW9uQ29tcG9zZUFzc2V0ID0gbmV3IEFzc2V0KFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2R1Y3Rpb25Db21wb3NlQXNzZXQnLFxuICAgICAge1xuICAgICAgICBwYXRoOiAnLi9zY3JpcHRzL2RvY2tlci1jb21wb3NlLXByb2QnLFxuICAgICAgfSxcbiAgICApO1xuICAgIHByb2R1Y3Rpb25Db21wb3NlQXNzZXQuZ3JhbnRSZWFkKGFzZy5ncmFudFByaW5jaXBhbCk7XG4gICAgYXNnLnVzZXJEYXRhLmFkZFMzRG93bmxvYWRDb21tYW5kKHtcbiAgICAgIGJ1Y2tldDogcHJvZHVjdGlvbkNvbXBvc2VBc3NldC5idWNrZXQsXG4gICAgICBidWNrZXRLZXk6IHByb2R1Y3Rpb25Db21wb3NlQXNzZXQuczNPYmplY3RLZXksXG4gICAgICBsb2NhbEZpbGU6ICcvaG9tZS9lYzItdXNlci9kb2NrZXItY29tcG9zZS55bWwnLFxuICAgIH0pO1xuXG4gICAgLy8gZWMyIGluc3RhbmNlIHVzZXIgZGF0YVxuICAgIGNvbnN0IHByb2R1Y3Rpb25TZXR1cFNjcmlwdCA9IHJlYWRGaWxlU3luYyhcbiAgICAgICcuL3NjcmlwdHMvcHJvZHVjdGlvblNldHVwLnNoJyxcbiAgICAgICd1dGY4JyxcbiAgICApO1xuICAgIGFzZy5hZGRVc2VyRGF0YShwcm9kdWN0aW9uU2V0dXBTY3JpcHQpO1xuXG4gICAgLy8gZGVmaW5lIHRhcmdldCBncm91cHNcbiAgICBjb25zdCB0YXJnZXQgPSBuZXcgZWxidjIuQXBwbGljYXRpb25UYXJnZXRHcm91cChcbiAgICAgIHRoaXMsXG4gICAgICAnQXJpYURlbW9Qcm9kLXRhcmdldCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgcG9ydDogODAsXG4gICAgICAgIHRhcmdldHM6IFthc2ddLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgbGlzdGVuZXIuYWRkQWN0aW9uKCdkZWZhdWx0Jywge1xuICAgICAgYWN0aW9uOiBlbGJ2Mi5MaXN0ZW5lckFjdGlvbi53ZWlnaHRlZEZvcndhcmQoW1xuICAgICAgICB7XG4gICAgICAgICAgdGFyZ2V0R3JvdXA6IHRhcmdldCxcbiAgICAgICAgICB3ZWlnaHQ6IDEsXG4gICAgICAgIH0sXG4gICAgICBdKSxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcmlhRGVtb1Byb2QtYWxiRE5TJywge1xuICAgICAgdmFsdWU6IGBodHRwOi8vJHthbGIubG9hZEJhbGFuY2VyRG5zTmFtZX1gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=
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
        const instance = {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machineImage: new ec2.AmazonLinuxImage({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            minCapacity: 1,
            maxCapacity: 1,
            securityGroup: webserverSG,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
        };
        const sshKey = process.env.SSH_KEY_PAIR;
        if (sshKey) {
            // @ts-ignore
            instance.keyName = sshKey;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWFyaWEtZGVtby1wcm9kdWN0aW9uLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLWFyaWEtZGVtby1wcm9kdWN0aW9uLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0Q7QUFDeEQsc0RBQXdDO0FBQ3hDLDJFQUE2RDtBQUM3RCxtREFBcUM7QUFDckMsMERBQTZDO0FBQzdDLDJCQUFnQztBQUNoQywrQ0FBaUM7QUFFakMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWhCLE1BQWEsdUJBQXdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDcEQsWUFBWSxLQUFjLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU07UUFDTixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEVBQUMsV0FBVyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUM7UUFFcEUsNEJBQTRCO1FBQzVCLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN0RSxHQUFHO1lBQ0gsY0FBYyxFQUFFLElBQUk7U0FDckIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsRUFBRTtZQUN4RCxJQUFJLEVBQUUsRUFBRTtZQUNSLElBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQyxDQUFDO1FBRUgsNkNBQTZDO1FBQzdDLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FDdkMsSUFBSSxFQUNKLDJCQUEyQixFQUMzQjtZQUNFLEdBQUc7WUFDSCxnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQ0YsQ0FBQztRQUVGLFdB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Q25CLE1BQU0sRUFBRSxDQUFDO2lCQUNWO2FBQ0YsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDN0MsS0FBSyxFQUFFLFVBQVUsR0FBRyxDQUFDLG1CQUFtQixFQUFFO1NBQzNDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWhJRCwwREFnSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdAYXdzLWNkay9hd3MtYXV0b3NjYWxpbmcnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ0Bhd3MtY2RrL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnQGF3cy1jZGsvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHtBc3NldH0gZnJvbSAnQGF3cy1jZGsvYXdzLXMzLWFzc2V0cyc7XG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgZG90ZW52IGZyb20gJ2RvdGVudic7XG5cbmRvdGVudi5jb25maWcoKTtcblxuZXhwb3J0IGNsYXNzIEFyaWFEZW1vUHJvZHVjdGlvblN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIHZwY1xuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdBcmlhRGVtb1Byb2QtdnBjJywge25hdEdhdGV3YXlzOiAxfSk7XG5cbiAgICAvLyBhcHBsaWNhdGlvbiBsb2FkIGJhbGFuY2VyXG4gICAgY29uc3QgYWxiID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKHRoaXMsICdBcmlhRGVtb1Byb2QtYWxiJywge1xuICAgICAgdnBjLFxuICAgICAgaW50ZXJuZXRGYWNpbmc6IHRydWUsXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0ZW5lciA9IGFsYi5hZGRMaXN0ZW5lcignQXJpYURlbW9Qcm9kLUxpc3RlbmVyJywge1xuICAgICAgcG9ydDogODAsXG4gICAgICBvcGVuOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8g8J+RhyBjcmVhdGUgc2VjdXJpdHkgZ3JvdXAgZm9yIGVjMiBpbnN0YW5jZXNcbiAgICBjb25zdCB3ZWJzZXJ2ZXJTRyA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIHRoaXMsXG4gICAgICAnQXJpYURlbW9Qcm9kLXdlYnNlcnZlci1zZycsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIHdlYnNlcnZlclNHLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDIyKSxcbiAgICAgICdhbGxvdyBTU0ggYWNjZXNzIGZyb20gYW55d2hlcmUnLFxuICAgICk7XG5cbiAgICB3ZWJzZXJ2ZXJTRy5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg4MCksXG4gICAgICAnYWxsb3cgaHR0cCBhY2Nlc3MgZnJvbSBhbnl3aGVyZScsXG4gICAgKTtcblxuICAgIGNvbnN0IGluc3RhbmNlID0ge1xuICAgICAgdnBjLFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKFxuICAgICAgICBlYzIuSW5zdGFuY2VDbGFzcy5UMixcbiAgICAgICAgZWMyLkluc3RhbmNlU2l6ZS5NSUNSTyxcbiAgICAgICksXG4gICAgICBtYWNoaW5lSW1hZ2U6IG5ldyBlYzIuQW1hem9uTGludXhJbWFnZSh7XG4gICAgICAgIGdlbmVyYXRpb246IGVjMi5BbWF6b25MaW51eEdlbmVyYXRpb24uQU1BWk9OX0xJTlVYXzIsXG4gICAgICB9KSxcbiAgICAgIG1pbkNhcGFjaXR5OiAxLFxuICAgICAgbWF4Q2FwYWNpdHk6IDEsXG4gICAgICBzZWN1cml0eUdyb3VwOiB3ZWJzZXJ2ZXJTRyxcbiAgICAgIHZwY1N1Ym5ldHM6IHtcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uc3Qgc3NoS2V5ID0gcHJvY2Vzcy5lbnYuU1NIX0tFWV9QQUlSO1xuICAgIGlmIChzc2hLZXkpIHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGluc3RhbmNlLmtleU5hbWUgPSBzc2hLZXk7XG4gICAgfVxuXG4gICAgY29uc3QgYXNnID0gbmV3IGF1dG9zY2FsaW5nLkF1dG9TY2FsaW5nR3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ0FyaWFEZW1vUHJvZC1hc2cnLFxuICAgICAgaW5zdGFuY2UsXG4gICAgKTtcblxuICAgIGNvbnN0IHByb2R1Y3Rpb25JbWFnZUFzc2V0ID0gbmV3IEFzc2V0KFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2R1Y3Rpb25JbWFnZUFzc2V0JyxcbiAgICAgIHtcbiAgICAgICAgcGF0aDogJy4vYXJ0aWZhY3RzL2RlbW9Qcm9kdWN0aW9uLnRhcicsXG4gICAgICB9LFxuICAgICk7XG4gICAgcHJvZHVjdGlvbkltYWdlQXNzZXQuZ3JhbnRSZWFkKGFzZy5ncmFudFByaW5jaXBhbCk7XG4gICAgYXNnLnVzZXJEYXRhLmFkZFMzRG93bmxvYWRDb21tYW5kKHtcbiAgICAgIGJ1Y2tldDogcHJvZHVjdGlvbkltYWdlQXNzZXQuYnVja2V0LFxuICAgICAgYnVja2V0S2V5OiBwcm9kdWN0aW9uSW1hZ2VBc3NldC5zM09iamVjdEtleSxcbiAgICAgIGxvY2FsRmlsZTogJy9ob21lL2VjMi11c2VyL2RlbW9Qcm9kdWN0aW9uLnRhcicsXG4gICAgfSk7XG5cbiAgICBjb25zdCBwcm9kdWN0aW9uQ29tcG9zZUFzc2V0ID0gbmV3IEFzc2V0KFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2R1Y3Rpb25Db21wb3NlQXNzZXQnLFxuICAgICAge1xuICAgICAgICBwYXRoOiAnLi9zY3JpcHRzL2RvY2tlci1jb21wb3NlLXByb2QnLFxuICAgICAgfSxcbiAgICApO1xuICAgIHByb2R1Y3Rpb25Db21wb3NlQXNzZXQuZ3JhbnRSZWFkKGFzZy5ncmFudFByaW5jaXBhbCk7XG4gICAgYXNnLnVzZXJEYXRhLmFkZFMzRG93bmxvYWRDb21tYW5kKHtcbiAgICAgIGJ1Y2tldDogcHJvZHVjdGlvbkNvbXBvc2VBc3NldC5idWNrZXQsXG4gICAgICBidWNrZXRLZXk6IHByb2R1Y3Rpb25Db21wb3NlQXNzZXQuczNPYmplY3RLZXksXG4gICAgICBsb2NhbEZpbGU6ICcvaG9tZS9lYzItdXNlci9kb2NrZXItY29tcG9zZS55bWwnLFxuICAgIH0pO1xuXG4gICAgLy8gZWMyIGluc3RhbmNlIHVzZXIgZGF0YVxuICAgIGNvbnN0IHByb2R1Y3Rpb25TZXR1cFNjcmlwdCA9IHJlYWRGaWxlU3luYyhcbiAgICAgICcuL3NjcmlwdHMvcHJvZHVjdGlvblNldHVwLnNoJyxcbiAgICAgICd1dGY4JyxcbiAgICApO1xuICAgIGFzZy5hZGRVc2VyRGF0YShwcm9kdWN0aW9uU2V0dXBTY3JpcHQpO1xuXG4gICAgLy8gZGVmaW5lIHRhcmdldCBncm91cHNcbiAgICBjb25zdCB0YXJnZXQgPSBuZXcgZWxidjIuQXBwbGljYXRpb25UYXJnZXRHcm91cChcbiAgICAgIHRoaXMsXG4gICAgICAnQXJpYURlbW9Qcm9kLXRhcmdldCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgcG9ydDogODAsXG4gICAgICAgIHRhcmdldHM6IFthc2ddLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgbGlzdGVuZXIuYWRkQWN0aW9uKCdkZWZhdWx0Jywge1xuICAgICAgYWN0aW9uOiBlbGJ2Mi5MaXN0ZW5lckFjdGlvbi53ZWlnaHRlZEZvcndhcmQoW1xuICAgICAgICB7XG4gICAgICAgICAgdGFyZ2V0R3JvdXA6IHRhcmdldCxcbiAgICAgICAgICB3ZWlnaHQ6IDEsXG4gICAgICAgIH0sXG4gICAgICBdKSxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcmlhRGVtb1Byb2QtYWxiRE5TJywge1xuICAgICAgdmFsdWU6IGBodHRwOi8vJHthbGIubG9hZEJhbGFuY2VyRG5zTmFtZX1gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=
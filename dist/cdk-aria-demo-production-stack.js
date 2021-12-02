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
            path: './artifacts/demoBaseline.tar',
        });
        productionImageAsset.grantRead(asg.grantPrincipal);
        asg.userData.addS3DownloadCommand({
            bucket: productionImageAsset.bucket,
            bucketKey: productionImageAsset.s3ObjectKey,
            localFile: '/home/ec2-user/demoBaseline.tar',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWFyaWEtZGVtby1wcm9kdWN0aW9uLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2Nkay1hcmlhLWRlbW8tcHJvZHVjdGlvbi1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0VBQXdEO0FBQ3hELHNEQUF3QztBQUN4QywyRUFBNkQ7QUFDN0QsbURBQXFDO0FBQ3JDLDBEQUE2QztBQUM3QywyQkFBZ0M7QUFFaEMsTUFBYSx1QkFBd0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNwRCxZQUFZLEtBQWMsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTTtRQUNOLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsRUFBQyxXQUFXLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQztRQUVwRSw0QkFBNEI7UUFDNUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3RFLEdBQUc7WUFDSCxjQUFjLEVBQUUsSUFBSTtTQUNyQixDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLHVCQUF1QixFQUFFO1lBQ3hELElBQUksRUFBRSxFQUFFO1lBQ1IsSUFBSSxFQUFFLElBQUk7U0FDWCxDQUFDLENBQUM7UUFFSCw2Q0FBNkM7UUFDN0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUN2QyxJQUFJLEVBQ0osMkJBQTJCLEVBQzNCO1lBQ0UsR0FBRztZQUNILGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FDRixDQUFDO1FBRUYsV0FBVyxDQUFDLGNBQWMsQ0FDeEIsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQ2hCLGdDQUFnQyxDQUNqQyxDQUFDO1FBRUYsV0FBVyxDQUFDLGNBQWMsQ0FDeEIsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQ2hCLGlDQUFpQyxDQUNsQyxDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUc7WUFDZixHQUFHO1lBQ0gsWUFBWSxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUMvQixHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFDcEIsR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQ3ZCO1lBQ0QsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNyQyxVQUFVLEVBQUUsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGNBQWM7YUFDckQsQ0FBQztZQUNGLFdBQVcsRUFBRSxDQUFDO1lBQ2QsV0FBVyxFQUFFLENBQUM7WUFDZCxPQUFPLEVBQUUsY0FBYztZQUN2QixhQUFhLEVBQUUsV0FBVztZQUMxQixVQUFVLEVBQUU7Z0JBQ1YsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTTthQUNsQztTQUNGLENBQUM7UUFFRixNQUFNLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FDMUMsSUFBSSxFQUNKLGtCQUFrQixFQUNsQixRQUFRLENBQ1QsQ0FBQztRQUVGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxxQkFBSyxDQUNwQyxJQUFJLEVBQ0osOEJBQThCLEVBQzlCO1lBQ0UsSUFBSSxFQUFFLDhCQUE4QjtTQUNyQyxDQUNGLENBQUM7UUFDRixvQkFBb0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ25ELEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUM7WUFDaEMsTUFBTSxFQUFFLG9CQUFvQixDQUFDLE1BQU07WUFDbkMsU0FBUyxFQUFFLG9CQUFvQixDQUFDLFdBQVc7WUFDM0MsU0FBUyxFQUFFLGlDQUFpQztTQUM3QyxDQUFDLENBQUM7UUFFSCxNQUFNLHNCQUFzQixHQUFHLElBQUkscUJBQUssQ0FDdEMsSUFBSSxFQUNKLGdDQUFnQyxFQUNoQztZQUNFLElBQUksRUFBRSwrQkFBK0I7U0FDdEMsQ0FDRixDQUFDO1FBQ0Ysc0JBQXNCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNyRCxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDO1lBQ2hDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQyxNQUFNO1lBQ3JDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxXQUFXO1lBQzdDLFNBQVMsRUFBRSxtQ0FBbUM7U0FDL0MsQ0FBQyxDQUFDO1FBRUgseUJBQXlCO1FBQ3pCLE1BQU0scUJBQXFCLEdBQUcsaUJBQVksQ0FDeEMsOEJBQThCLEVBQzlCLE1BQU0sQ0FDUCxDQUFDO1FBQ0YsR0FBRyxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBRXZDLHVCQUF1QjtRQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FDN0MsSUFBSSxFQUNKLHFCQUFxQixFQUNyQjtZQUNFLEdBQUc7WUFDSCxJQUFJLEVBQUUsRUFBRTtZQUNSLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNmLENBQ0YsQ0FBQztRQUVGLFFBQVEsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzVCLE1BQU0sRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQztnQkFDM0M7b0JBQ0UsV0FBVyxFQUFFLE1BQU07b0JBQ25CLE1BQU0sRUFBRSxDQUFDO2lCQUNWO2FBQ0YsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDN0MsS0FBSyxFQUFFLFVBQVUsR0FBRyxDQUFDLG1CQUFtQixFQUFFO1NBQzNDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNIRCwwREEySEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdAYXdzLWNkay9hd3MtYXV0b3NjYWxpbmcnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ0Bhd3MtY2RrL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnQGF3cy1jZGsvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHtBc3NldH0gZnJvbSAnQGF3cy1jZGsvYXdzLXMzLWFzc2V0cyc7XG5pbXBvcnQge3JlYWRGaWxlU3luY30gZnJvbSAnZnMnO1xuXG5leHBvcnQgY2xhc3MgQXJpYURlbW9Qcm9kdWN0aW9uU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gdnBjXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgJ0FyaWFEZW1vUHJvZC12cGMnLCB7bmF0R2F0ZXdheXM6IDF9KTtcblxuICAgIC8vIGFwcGxpY2F0aW9uIGxvYWQgYmFsYW5jZXJcbiAgICBjb25zdCBhbGIgPSBuZXcgZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXIodGhpcywgJ0FyaWFEZW1vUHJvZC1hbGInLCB7XG4gICAgICB2cGMsXG4gICAgICBpbnRlcm5ldEZhY2luZzogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpc3RlbmVyID0gYWxiLmFkZExpc3RlbmVyKCdBcmlhRGVtb1Byb2QtTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA4MCxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyDwn5GHIGNyZWF0ZSBzZWN1cml0eSBncm91cCBmb3IgZWMyIGluc3RhbmNlc1xuICAgIGNvbnN0IHdlYnNlcnZlclNHID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2Qtd2Vic2VydmVyLXNnJyxcbiAgICAgIHtcbiAgICAgICAgdnBjLFxuICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgd2Vic2VydmVyU0cuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC50Y3AoMjIpLFxuICAgICAgJ2FsbG93IFNTSCBhY2Nlc3MgZnJvbSBhbnl3aGVyZScsXG4gICAgKTtcblxuICAgIHdlYnNlcnZlclNHLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdhbGxvdyBodHRwIGFjY2VzcyBmcm9tIGFueXdoZXJlJyxcbiAgICApO1xuXG4gICAgY29uc3QgaW5zdGFuY2UgPSB7XG4gICAgICB2cGMsXG4gICAgICBpbnN0YW5jZVR5cGU6IGVjMi5JbnN0YW5jZVR5cGUub2YoXG4gICAgICAgIGVjMi5JbnN0YW5jZUNsYXNzLlQyLFxuICAgICAgICBlYzIuSW5zdGFuY2VTaXplLk1JQ1JPLFxuICAgICAgKSxcbiAgICAgIG1hY2hpbmVJbWFnZTogbmV3IGVjMi5BbWF6b25MaW51eEltYWdlKHtcbiAgICAgICAgZ2VuZXJhdGlvbjogZWMyLkFtYXpvbkxpbnV4R2VuZXJhdGlvbi5BTUFaT05fTElOVVhfMixcbiAgICAgIH0pLFxuICAgICAgbWluQ2FwYWNpdHk6IDEsXG4gICAgICBtYXhDYXBhY2l0eTogMSxcbiAgICAgIGtleU5hbWU6ICdlYzIta2V5LXBhaXInLCAvLyByZXBsYWNlIHRoaXMgd2l0aCB5b3VyIHNlY3VyaXR5IGtleVxuICAgICAgc2VjdXJpdHlHcm91cDogd2Vic2VydmVyU0csXG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbnN0IGFzZyA9IG5ldyBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2QtYXNnJyxcbiAgICAgIGluc3RhbmNlLFxuICAgICk7XG5cbiAgICBjb25zdCBwcm9kdWN0aW9uSW1hZ2VBc3NldCA9IG5ldyBBc3NldChcbiAgICAgIHRoaXMsXG4gICAgICAnQXJpYURlbW9Qcm9kdWN0aW9uSW1hZ2VBc3NldCcsXG4gICAgICB7XG4gICAgICAgIHBhdGg6ICcuL2FydGlmYWN0cy9kZW1vQmFzZWxpbmUudGFyJyxcbiAgICAgIH0sXG4gICAgKTtcbiAgICBwcm9kdWN0aW9uSW1hZ2VBc3NldC5ncmFudFJlYWQoYXNnLmdyYW50UHJpbmNpcGFsKTtcbiAgICBhc2cudXNlckRhdGEuYWRkUzNEb3dubG9hZENvbW1hbmQoe1xuICAgICAgYnVja2V0OiBwcm9kdWN0aW9uSW1hZ2VBc3NldC5idWNrZXQsXG4gICAgICBidWNrZXRLZXk6IHByb2R1Y3Rpb25JbWFnZUFzc2V0LnMzT2JqZWN0S2V5LFxuICAgICAgbG9jYWxGaWxlOiAnL2hvbWUvZWMyLXVzZXIvZGVtb0Jhc2VsaW5lLnRhcicsXG4gICAgfSk7XG5cbiAgICBjb25zdCBwcm9kdWN0aW9uQ29tcG9zZUFzc2V0ID0gbmV3IEFzc2V0KFxuICAgICAgdGhpcyxcbiAgICAgICdBcmlhRGVtb1Byb2R1Y3Rpb25Db21wb3NlQXNzZXQnLFxuICAgICAge1xuICAgICAgICBwYXRoOiAnLi9zY3JpcHRzL2RvY2tlci1jb21wb3NlLXByb2QnLFxuICAgICAgfSxcbiAgICApO1xuICAgIHByb2R1Y3Rpb25Db21wb3NlQXNzZXQuZ3JhbnRSZWFkKGFzZy5ncmFudFByaW5jaXBhbCk7XG4gICAgYXNnLnVzZXJEYXRhLmFkZFMzRG93bmxvYWRDb21tYW5kKHtcbiAgICAgIGJ1Y2tldDogcHJvZHVjdGlvbkNvbXBvc2VBc3NldC5idWNrZXQsXG4gICAgICBidWNrZXRLZXk6IHByb2R1Y3Rpb25Db21wb3NlQXNzZXQuczNPYmplY3RLZXksXG4gICAgICBsb2NhbEZpbGU6ICcvaG9tZS9lYzItdXNlci9kb2NrZXItY29tcG9zZS55bWwnLFxuICAgIH0pO1xuXG4gICAgLy8gZWMyIGluc3RhbmNlIHVzZXIgZGF0YVxuICAgIGNvbnN0IHByb2R1Y3Rpb25TZXR1cFNjcmlwdCA9IHJlYWRGaWxlU3luYyhcbiAgICAgICcuL3NjcmlwdHMvcHJvZHVjdGlvblNldHVwLnNoJyxcbiAgICAgICd1dGY4JyxcbiAgICApO1xuICAgIGFzZy5hZGRVc2VyRGF0YShwcm9kdWN0aW9uU2V0dXBTY3JpcHQpO1xuXG4gICAgLy8gZGVmaW5lIHRhcmdldCBncm91cHNcbiAgICBjb25zdCB0YXJnZXQgPSBuZXcgZWxidjIuQXBwbGljYXRpb25UYXJnZXRHcm91cChcbiAgICAgIHRoaXMsXG4gICAgICAnQXJpYURlbW9Qcm9kLXRhcmdldCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgcG9ydDogODAsXG4gICAgICAgIHRhcmdldHM6IFthc2ddLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgbGlzdGVuZXIuYWRkQWN0aW9uKCdkZWZhdWx0Jywge1xuICAgICAgYWN0aW9uOiBlbGJ2Mi5MaXN0ZW5lckFjdGlvbi53ZWlnaHRlZEZvcndhcmQoW1xuICAgICAgICB7XG4gICAgICAgICAgdGFyZ2V0R3JvdXA6IHRhcmdldCxcbiAgICAgICAgICB3ZWlnaHQ6IDEsXG4gICAgICAgIH0sXG4gICAgICBdKSxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcmlhRGVtb1Byb2QtYWxiRE5TJywge1xuICAgICAgdmFsdWU6IGBodHRwOi8vJHthbGIubG9hZEJhbGFuY2VyRG5zTmFtZX1gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=
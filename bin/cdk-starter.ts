#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import {AriaDemoProductionStack} from '../lib/cdk-aria-demo-production-stack';

const app = new cdk.App();
new AriaDemoProductionStack(app, 'Aria-Demo-Production', {
  stackName: 'Aria-Demo-Production',
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

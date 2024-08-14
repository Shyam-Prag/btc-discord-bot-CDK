#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BtcDiscordBotCdkStack } from '../lib/btc-discord-bot-cdk-stack';

const app = new cdk.App();
new BtcDiscordBotCdkStack(app, 'BtcDiscordBotCdkStack', {

});

cdk.Tags.of(app).add("auto-delete", "no")
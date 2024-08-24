import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {LAMBDA_ROLE, LAMBDA_LAYER_ARN, BTC_URL, API_KEY, DISCORD_WEBHOOK_URL, FONT_LAYER, EMAIL_ADDRESS} from '../assets/application';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';

import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';   
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubs from 'aws-cdk-lib/aws-sns-subscriptions';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';

export class BtcDiscordBotCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const btcFunction = new lambda.Function(this, 'btcFunction', {
      runtime: lambda.Runtime.PYTHON_3_12, 
      code: lambda.Code.fromAsset('lambda'), 
      handler: 'lambda_function.lambda_handler',
      timeout: Duration.seconds(900),
      memorySize: 512,
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(this, 'BtcLambdaLayer', LAMBDA_LAYER_ARN),
        lambda.LayerVersion.fromLayerVersionArn(this, 'verdanazFontLambdaLayer', FONT_LAYER),
      ],
      environment: {
        API_KEY: API_KEY,
        BTC_URL: BTC_URL,
        DISCORD_WEBHOOK_URL: DISCORD_WEBHOOK_URL
      },
      tracing: lambda.Tracing.ACTIVE,
    });
    
    
    const btcFunctionRole = new iam.Role(this, 'btcFunctionRole', {
      roleName: `${LAMBDA_ROLE}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ],
    });
    
    const topic = new sns.Topic(this, "Lambda_btc_topic", {
      displayName: "Lambda_btc_topic",
      topicName: "Lambda_btc_topic"
    });
    
    topic.addSubscription(new snsSubs.EmailSubscription(EMAIL_ADDRESS));
    
    
    // add cloudwath alarm for Lambda error metrics
    const lambdaAlarm = new cloudwatch.Alarm(this, "LambdaCWAlarm", {
      alarmName: "btc_lambda_cloudwatch_alarm",
      metric: btcFunction.metricErrors(),
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: new cloudwatch.AlarmAction(topic),
      
    })
    
    // add eventbridge cron job 
    const cronRule = new events.Rule(this, 'CronRule', {
      schedule: events.Schedule.expression('rate(4 hours)')
    });
    
    cronRule.addTarget(new targets.LambdaFunction(btcFunction));
    
    //random comment
  
  }
}

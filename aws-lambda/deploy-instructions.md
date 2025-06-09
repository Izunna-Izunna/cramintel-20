
# AWS Lambda Deployment Instructions

## Prerequisites
1. AWS CLI configured with appropriate permissions
2. Node.js 18+ installed
3. IAM role with the following permissions:
   - `AmazonTextractFullAccess`
   - `AmazonS3FullAccess` (or specific bucket permissions)
   - `AWSLambdaBasicExecutionRole`

## Deployment Steps

1. **Create the S3 bucket for temporary files:**
   ```bash
   aws s3 mb s3://cramintel-textract-temp --region us-east-1
   ```

2. **Create IAM role for Lambda:**
   ```bash
   aws iam create-role --role-name textract-lambda-role --assume-role-policy-document '{
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "lambda.amazonaws.com"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }'
   ```

3. **Attach policies to the role:**
   ```bash
   aws iam attach-role-policy --role-name textract-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
   aws iam attach-role-policy --role-name textract-lambda-role --policy-arn arn:aws:iam::aws:policy/AmazonTextractFullAccess
   aws iam attach-role-policy --role-name textract-lambda-role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
   ```

4. **Package and deploy the Lambda function:**
   ```bash
   cd aws-lambda/textract-processor
   npm install
   zip -r textract-processor.zip .
   
   aws lambda create-function \
     --function-name textract-processor \
     --runtime nodejs18.x \
     --role arn:aws:iam::YOUR_ACCOUNT_ID:role/textract-lambda-role \
     --handler index.handler \
     --zip-file fileb://textract-processor.zip \
     --timeout 900 \
     --memory-size 1024 \
     --environment Variables='{TEMP_BUCKET=cramintel-textract-temp,AWS_REGION=us-east-1}'
   ```

5. **Create a Function URL for HTTP access:**
   ```bash
   aws lambda create-function-url-config \
     --function-name textract-processor \
     --cors '{
       "AllowCredentials": false,
       "AllowHeaders": ["content-type"],
       "AllowMethods": ["*"],
       "AllowOrigins": ["*"],
       "ExposeHeaders": ["date"],
       "MaxAge": 86400
     }' \
     --auth-type NONE
   ```

6. **Get the Function URL:**
   ```bash
   aws lambda get-function-url-config --function-name textract-processor
   ```

## Environment Variables
Set these in the Lambda function configuration:
- `TEMP_BUCKET`: `cramintel-textract-temp`
- `AWS_REGION`: `us-east-1` (or your preferred region)

## Testing
You can test the function using the AWS CLI:
```bash
aws lambda invoke \
  --function-name textract-processor \
  --payload '{"body":"{\"fileBuffer\":\"base64-encoded-content\",\"fileName\":\"test.pdf\",\"fileType\":\"application/pdf\"}"}' \
  response.json
```

## Cost Optimization
- The function has a 15-minute timeout for large PDF processing
- Memory is set to 1024MB for optimal performance
- S3 cleanup is automatic to avoid storage costs
- Consider setting up CloudWatch alarms for monitoring costs

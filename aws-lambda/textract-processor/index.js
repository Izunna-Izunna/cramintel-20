
const { TextractClient, DetectDocumentTextCommand, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } = require('@aws-sdk/client-textract');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Initialize AWS clients
const textractClient = new TextractClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const TEMP_BUCKET = process.env.TEMP_BUCKET || 'cramintel-textract-temp';

exports.handler = async (event) => {
  console.log('Lambda event:', JSON.stringify(event, null, 2));
  
  try {
    const { body } = event;
    const { fileBuffer, fileName, fileType } = JSON.parse(body);
    
    if (!fileBuffer || !fileType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing fileBuffer or fileType' })
      };
    }

    // Convert base64 buffer back to bytes
    const fileBytes = Buffer.from(fileBuffer, 'base64');
    console.log('Processing file:', fileName, 'Type:', fileType, 'Size:', fileBytes.length);

    let result;

    if (fileType === 'application/pdf') {
      result = await processPdfWithS3(fileBytes, fileName);
    } else if (fileType.startsWith('image/')) {
      result = await processImageSync(fileBytes);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        extractedText: result.text,
        confidence: result.confidence,
        method: result.method,
        metadata: result.metadata
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};

async function processImageSync(fileBytes) {
  console.log('Processing image with sync Textract');
  
  const command = new DetectDocumentTextCommand({
    Document: {
      Bytes: fileBytes
    }
  });

  const response = await textractClient.send(command);
  
  let extractedText = '';
  let totalConfidence = 0;
  let blockCount = 0;

  if (response.Blocks) {
    for (const block of response.Blocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        extractedText += block.Text + '\n';
        if (block.Confidence) {
          totalConfidence += block.Confidence;
          blockCount++;
        }
      }
    }
  }

  const averageConfidence = blockCount > 0 ? totalConfidence / blockCount : 0;

  console.log(`Sync Textract completed: ${extractedText.length} characters, ${averageConfidence.toFixed(1)}% confidence`);

  return {
    text: extractedText.trim(),
    confidence: averageConfidence,
    method: 'textract-sync',
    metadata: {
      totalBlocks: response.Blocks?.length || 0,
      textBlocks: blockCount,
      implementation: 'lambda-sync'
    }
  };
}

async function processPdfWithS3(fileBytes, fileName) {
  const key = `temp/${Date.now()}_${fileName}`;
  
  try {
    console.log('Uploading PDF to S3...');
    
    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: TEMP_BUCKET,
      Key: key,
      Body: fileBytes,
      ContentType: 'application/pdf'
    });

    await s3Client.send(putCommand);
    console.log('PDF uploaded to S3:', `s3://${TEMP_BUCKET}/${key}`);

    // Start async Textract job
    console.log('Starting async Textract job...');
    const startCommand = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: TEMP_BUCKET,
          Name: key
        }
      },
      ClientRequestToken: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      JobTag: key
    });

    const startResponse = await textractClient.send(startCommand);
    const jobId = startResponse.JobId;
    
    if (!jobId) {
      throw new Error('No JobId returned from StartDocumentTextDetection');
    }

    console.log('Async job started:', jobId);

    // Poll for completion
    let jobStatus = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max
    let allBlocks = [];

    while (jobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}...`);
      
      // Wait 10 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 10000));

      const getCommand = new GetDocumentTextDetectionCommand({
        JobId: jobId
      });

      const pollResponse = await textractClient.send(getCommand);
      jobStatus = pollResponse.JobStatus || 'IN_PROGRESS';
      
      console.log('Job status:', jobStatus);

      if (jobStatus === 'SUCCEEDED') {
        console.log('Async job completed successfully');
        
        // Collect all blocks with pagination
        if (pollResponse.Blocks) {
          allBlocks = [...allBlocks, ...pollResponse.Blocks];
        }

        let nextToken = pollResponse.NextToken;
        while (nextToken) {
          console.log('Fetching next page...');
          
          const nextCommand = new GetDocumentTextDetectionCommand({
            JobId: jobId,
            NextToken: nextToken
          });

          const nextResponse = await textractClient.send(nextCommand);
          if (nextResponse.Blocks) {
            allBlocks = [...allBlocks, ...nextResponse.Blocks];
          }
          nextToken = nextResponse.NextToken;
        }

        break;
      } else if (jobStatus === 'FAILED') {
        throw new Error(`Async Textract job failed: ${pollResponse.StatusMessage || 'Unknown error'}`);
      }
    }

    if (jobStatus === 'IN_PROGRESS') {
      throw new Error('Async job timed out after maximum polling attempts');
    }

    // Extract text from blocks
    let extractedText = '';
    let totalConfidence = 0;
    let lineCount = 0;

    for (const block of allBlocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        extractedText += block.Text + '\n';
        if (block.Confidence) {
          totalConfidence += block.Confidence;
          lineCount++;
        }
      }
    }

    const averageConfidence = lineCount > 0 ? totalConfidence / lineCount : 0;

    console.log(`S3-based async Textract completed: ${extractedText.length} characters from ${lineCount} lines, ${averageConfidence.toFixed(1)}% confidence`);

    return {
      text: extractedText.trim(),
      confidence: averageConfidence,
      method: 'textract-async-s3',
      metadata: {
        totalBlocks: allBlocks.length,
        lineBlocks: lineCount,
        jobId: jobId,
        s3Location: `s3://${TEMP_BUCKET}/${key}`,
        implementation: 'lambda-async-s3',
        pollingAttempts: attempts
      }
    };

  } catch (error) {
    console.error('S3-based async processing error:', error);
    throw new Error(`S3-based async processing failed: ${error.message}`);
  } finally {
    // Clean up S3 object
    try {
      console.log('Cleaning up S3 object...');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: TEMP_BUCKET,
        Key: key
      });
      await s3Client.send(deleteCommand);
      console.log('S3 cleanup completed');
    } catch (cleanupError) {
      console.error('S3 cleanup failed:', cleanupError);
    }
  }
}

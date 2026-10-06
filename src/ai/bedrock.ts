import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

let client: BedrockRuntimeClient | null = null;
const getClient = () =>
  (client ??= new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' }));

const MODEL_ID = () => process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-lite-v1:0';

export async function askBedrock(system: string, prompt: string): Promise<string> {
  const res = await getClient().send(
    new ConverseCommand({
      modelId: MODEL_ID(),
      system: [{ text: system }],
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 700, temperature: 0.3 },
    })
  );
  return res.output?.message?.content?.map((c) => c.text ?? '').join('') || '';
}

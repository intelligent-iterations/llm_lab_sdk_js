import { LLMLabSDK } from '../index.js'; 

const sdk = new LLMLabSDK('your apikey');

const model = 'agentId';
const messages = [{ role: 'user', content: 'Hello, how are you?' }];
const sessionId = 'optional_session_id'; // Use a real session ID if required

async function runChatWithAgent() {
  try {
    const response = await sdk.chatWithAgentFuture({
      model: model,
      messages: messages,
      sessionId: sessionId,
      maxTokens: 40,
      temperature: 0.5
    });
    console.log('Chat response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

runChatWithAgent();
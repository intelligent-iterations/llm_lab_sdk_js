import { LLMLabSDK } from '../index.js'; 
import EventSource from 'eventsource';
global.EventSource = EventSource;

// Initialize your SDK
const sdk = new LLMLabSDK('your apikey');

// Define callbacks
const onSuccess = (chatResponse) => console.log('Received message:', chatResponse.response);
const onError = (error) => console.error('Error:', error);
const onComplete = () => console.log('Stream complete.');

// Define test parameters for the stream
const params = {
    sessionId: 'your_session_id',
    model: 'your_agent_id',
    messages: [{ role: 'user', content: 'Starting a stream.' }],
    maxTokens: 150,
    temperature: 0.5,
    onSuccess,
    onError,
    onComplete
};

// Define an async function to start the chat stream
async function initiateChatStream() {
    try {
        await sdk.startChatStream(params);
    } catch (error) {
        console.error('Failed to start the stream:', error);
    }
}

// Call the function to initiate the chat stream
initiateChatStream();

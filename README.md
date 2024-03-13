# LLMLabSDK

Quickly integrate an Intelligent Iterations chat bot into your application

## Features
   - **Chat Stream**: Use `sdk.startChatStream(params)` for streaming chats.
   - **Single Chat**: Use `sdk.chatWithAgentFuture(options)` for single chat responses.

## Getting Started

### Prerequisites
- Visit [LLM Lab](https://intelligentiterations.com) to log in or create an account.
- **Create an API Key:** Within your account settings, navigate to the API keys section and generate a new key. Remember to keep it secure.
- **Create an Agent:** Set up a new agent in your account and note its ID for SDK usage.

### Integration
1. **Install Dependencies:** Ensure `node-fetch` is added to your project.
2. **SDK Setup:**
   ```javascript
   import { LLMLabSDK } from '../index.js';
   const sdk = new LLMLabSDK('your_apikey');


## Examples

Check the `example` folder for detailed usage.


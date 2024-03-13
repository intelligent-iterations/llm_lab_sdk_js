import fetch from 'node-fetch';

export class LLMLabSDK {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://launch-api.com';
    }

    /**
     * Asynchronously initiates a chat with an AI agent and handles the response.
     * @param {string} model - The ID of the agent to use for the chat.
     * @param {Array<Object>} messages - An array of message objects with role and content.
     * @param {string|null} [sessionId=null] - An optional session ID for the chat that will track the conversation sequence.
     * @param {number|null} [maxTokens=null] - Maximum number of tokens to generate.
     * @param {number|null} [temperature=null] - The creativity temperature for responses.
     * @returns {Promise<Object>} A promise that resolves to the chat response object.
     */
    async chatWithAgentFuture({ model, messages, sessionId = null, maxTokens = null, temperature = null }) {
        try {
            const body = {
                model,
                stream: false,
                messages: messages.map(({ role, content }) => ({ role, content })),
                ...(maxTokens != null && { maxTokens }),
                ...(sessionId != null && { sessionId }),
                ...(temperature != null && { temperature }),
            };
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (response.status != 201) { // response.ok is true if the status code is 200-299
                throw new Error(`HTTP error! status: ${response.status}, message: ${data.message}`);
            }

            const message = data.choices[0].message.content;

            return { success: true, content: message };
        } catch (e) {
            console.error('chatWithAgent Exception:', e);
            return { success: false, error: e };
        }
    }


    /**
         * Asynchronously initiates a streaming chat session with the server.
         * This method sends a setup request to the server with details for the chat session.
         * Upon success, the server should respond with a URL for the EventSource to connect to for streaming chat events.
         * 
         * @param {Object} params - The parameters for the chat session.
         * @param {string} params.sessionId - The session ID for the chat.
         * @param {string} params.model - The ID of the agent to use for the chat.
         * @param {Array<Object>} params.messages - The initial set of messages for the chat, each with a role and content.
         * @param {number|null} [params.maxTokens=null] - The maximum number of tokens to generate (optional).
         * @param {number|null} [params.temperature=null] - The creativity temperature for the chat responses (optional).
 * @param {Function} onSuccess - Callback function to handle each chat message received. This function is called with an object containing two properties: `response` and `systemPrompt`. The `response` property is a string representing the AI's response to the chat message, and the `systemPrompt` property is a string representing the system's prompt
 * @example
 * const onSuccess = ({ response, systemPrompt }) => {
 *   console.log(`Response: ${response}`);
 *   console.log(`Prompt: ${systemPrompt}`);
 * };    
 *  * @param {Function} onError - Callback function to handle any errors.
     * @param {Function} onComplete - Callback function to call when the stream is complete.  
    */

    async startChatStream({ sessionId, model, messages, maxTokens = null, temperature = null, onSuccess, onError, onComplete }) {
        const url = `${this.baseUrl}/v1/chat/completions`;
        const headers = {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
        };
        const body = {
            "stream": true,
            "sessionId": sessionId,
            "model": model,
            "messages": messages.map(e => ({ 'role': e.role, 'content': e.content })),
            ...(maxTokens != null && { maxTokens }),
            ...(temperature != null && { temperature }),
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            if (!response.body) {
                throw new Error('Response does not contain a readable stream.');
            }

            this.readStream(response.body, onSuccess, onError, onComplete);
        } catch (error) {
            onError(`Failed to start the stream: ${error}`);
        }
    }
    readStream(stream, onSuccess, onError, onComplete) {
        let buffer = '';
        const decoder = new TextDecoder('utf-8'); // Use TextDecoder to decode from buffer to string

        stream.on('data', (chunk) => {
            // Decode chunk and append to buffer
            buffer += decoder.decode(chunk, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in the buffer

            lines.forEach(line => {
                if (line) { // Process only if the line is not empty
                    this.processLine(line, onSuccess, onError, onComplete);
                }
            });
        });

        stream.on('end', () => {
            // Process any remaining content in buffer as the last line
            if (buffer) {
                this.processLine(buffer, onSuccess, onError, onComplete);
            }
            console.log('Stream ended');
            onComplete();
        });

        stream.on('error', (error) => {
            console.error('Stream encountered an error:', error);
            onError(error.toString());
        });
    }
    processLine(line, onSuccess, onError, onComplete) {
        if (!line || !line.includes('data: ')) return;

        if (line.includes('undefined')) { // Replace 'streamEndMarker' with your actual marker
            console.log('Detected end of stream marker');
            onComplete();
            return; // Important to return to avoid processing this line further
        }

        try {
            if (line.startsWith('data: ')) {
                line = line.substring(6); // Remove "data: " to parse the JSON correctly
            }
            const data = JSON.parse(line);
            onSuccess(data);
        } catch (error) {
            onError(`Error processing data: ${error}`);
        }
    }

}






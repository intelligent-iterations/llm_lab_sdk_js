import fetch from 'node-fetch';
import EventSource from 'eventsource';

class LLMLabSDK {
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
    async chatWithAgent({ model, messages, sessionId = null, maxTokens = null, temperature = null }) {
        try {
            const body = {
                model,
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
        var body = {
            "stream": true,
            "sessionId": sessionId,
            "model": model,
            "messages": messages.map(e => ({ 'role': e.role, 'content': e.content })),
        };

        if (maxTokens != null) {
            body['maxTokens'] = maxTokens;
        }
        if (temperature != null) {
            body['temperature'] = temperature;
        }

        try {
            const response = await fetch(`${this.baseUrl}/startStreamSession`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (data.streamUrl) {
                this.listenToStream(data.streamUrl, onSuccess, onError, onComplete);
            } else {
                console.error('Failed to start stream session.');
                onError('Failed to start stream session.');
            }
        } catch (error) {
            console.error('Error starting chat stream:', error);
            onError(error);
        }
    }

    listenToStream(streamUrl, onSuccess, onError, onComplete) {
        this.eventSource = new EventSource(streamUrl);

        this.eventSource.onmessage = (event) => {
            try {
                const line = event.data;
                if (line.trim() === "" || !line.startsWith("data: ")) {
                    return;
                }
                const jsonData = line.substring("data: ".length).trim();
                if (jsonData.includes('statusCode')) {
                    onError(jsonData);
                    return;
                }
                if (jsonData.includes("undefined")) { // Marker for stream end
                    onComplete();
                    this.stopChatStream();
                    return;
                }

                const decoded = JSON.parse(jsonData);
                const chatResponse = this.createChatResponse(decoded);
                onSuccess(chatResponse);
            } catch (error) {
                console.error(`Error processing streamed data: ${error}`);
                onError(error);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('Stream encountered an error:', error);
            onError(error);
            this.stopChatStream();
        };
    }

    stopChatStream() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    createChatResponse(decoded) {
        return {
            response: decoded.response,
            systemPrompt: decoded.systemPrompt
        };
    }

    stopChatStream() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null; // Clear the EventSource object to avoid memory leaks
        }
    }

}

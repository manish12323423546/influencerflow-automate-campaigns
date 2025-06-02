import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import formBody from '@fastify/formbody';
import twilio from 'twilio';
import dotenv from 'dotenv';
import WebSocket from 'ws';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_AGENT_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const fastify = Fastify({ logger: true });

const start = async () => {
  try {
    await fastify.register(websocket);
    await fastify.register(formBody);

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Endpoint to initiate outbound calls
    fastify.post('/outbound-call', async (request, reply) => {
      const { number, prompt, first_message } = request.body;
      
      if (!number || !prompt || !first_message) {
        return reply.code(400).send({
          error: 'Missing required parameters: number, prompt, or first_message'
        });
      }

      try {
        const call = await twilioClient.calls.create({
          to: number,
          from: process.env.TWILIO_PHONE_NUMBER,
          twiml: `
            <Response>
              <Connect>
                <Stream url="wss://${request.hostname}/stream">
                  <Parameter name="prompt" value="${prompt}"/>
                  <Parameter name="first_message" value="${first_message}"/>
                </Stream>
              </Connect>
            </Response>
          `
        });

        return reply.send({
          message: 'Call initiated successfully',
          callSid: call.sid
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Failed to initiate call',
          details: error.message
        });
      }
    });

    // WebSocket endpoint for streaming audio
    fastify.get('/stream', { websocket: true }, (connection, req) => {
      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/agent/${process.env.ELEVENLABS_AGENT_ID}/stream`, {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
      });

      // Forward messages between Twilio and ElevenLabs
      connection.socket.on('message', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      ws.on('message', (data) => {
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.send(data);
        }
      });

      // Handle connection cleanup
      connection.socket.on('close', () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });

      ws.on('close', () => {
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.close();
        }
      });
    });

    const port = process.env.PORT || 8000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`[Server] Listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 
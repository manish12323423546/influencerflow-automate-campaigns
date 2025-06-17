from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
import json
from dotenv import load_dotenv

# Import your LangGraph agent
from langgraph-example-1.my_agent.agent import graph, safe_stream_graph, start_campaign

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str
    name: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Dict[str, Any] = {}
    stream: bool = False

async def stream_chat_response(state_generator):
    """Stream the chat response in the format expected by CopilotKit."""
    try:
        for chunk in state_generator:
            if isinstance(chunk, dict):
                # Extract response from state
                response = chunk.get("response", "")
                if response:
                    # Format as SSE data
                    data = {
                        "choices": [{
                            "delta": {"content": response},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                
                # Check for completion
                if chunk.get("status") == "completed" or chunk.get("force_end"):
                    # Send completion message
                    yield f"data: {json.dumps({'choices': [{'finish_reason': 'stop'}]})}\n\n"
                    break
                
                # Check for errors
                if chunk.get("error"):
                    error_data = {
                        "error": {
                            "message": chunk["error"],
                            "type": "stream_error"
                        }
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"
                    break
                
    except Exception as e:
        error_data = {
            "error": {
                "message": str(e),
                "type": "stream_error"
            }
        }
        yield f"data: {json.dumps(error_data)}\n\n"

@app.post("/api/copilot/langgraph")
async def chat_with_agent(request: ChatRequest):
    try:
        # Extract the last user message
        last_message = request.messages[-1].content if request.messages else ""
        
        # Initialize campaign state
        state = start_campaign(
            query=last_message,
            recipient_email=request.context.get("recipient_email", ""),
            phone_number=request.context.get("phone_number", "")
        )
        
        # Add any additional context from the request
        state.update(request.context)
        
        # Add thread_id for conversation tracking
        thread_id = request.context.get("thread_id", None)
        
        if request.stream:
            # Stream the response
            generator = safe_stream_graph(
                inputs=state,
                config={"recursion_limit": 25},
                thread_id=thread_id
            )
            
            return StreamingResponse(
                stream_chat_response(generator),
                media_type="text/event-stream"
            )
        else:
            # Run the LangGraph agent without streaming
            result = safe_invoke_graph(
                inputs=state,
                config={"recursion_limit": 25},
                thread_id=thread_id
            )
            
            # Extract the response from the result
            response = result.get("response", "I'm sorry, I couldn't process that request.")
            
            return {
                "choices": [{
                    "message": {
                        "content": response,
                        "role": "assistant"
                    },
                    "finish_reason": "stop"
                }],
                "state": result  # Include the full state for debugging
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "message": str(e),
                    "type": "server_error"
                }
            }
        )

@app.get("/health")
async def health_check():
    """Health check endpoint for CopilotKit."""
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info") 
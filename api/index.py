from fastapi import FastAPI, Response, Request 
import os
from fastapi.middleware.cors import CORSMiddleware

app = None
error_message_on_load = "g4f.api.create_app function not successfully called."

try:
    import g4f
    import g4f.debug
    g4f.debug.logging = True
    from g4f.api import create_app
    
    app = create_app() 
    print("PYTHON: Successfully called create_app() from g4f.api")
    
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        
        print(f"--- LOG 3: Python backend was successfully reached! Path: {request.url.path} ---")
        response = await call_next(request)
        return response

    allowed_origins = [
        "https://www.chloe.16-b.it",
        "http://localhost:3000",
    ]
    vercel_url = os.environ.get('VERCEL_URL')
    if vercel_url:
        allowed_origins.append(f"https://{vercel_url}")    
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins, 
        allow_credentials=True,
        allow_methods=["*"], 
        allow_headers=["*"], 
    )

    if not app or not hasattr(app, "routes"):
        error_message_on_load = "create_app did not return a valid FastAPI app instance."
        raise ImportError(error_message_on_load)
    
    error_message_on_load = None

except ImportError as e:
    error_message_on_load = f"PYTHON: Critical Error: Could not import 'create_app' from g4f.api or it failed. Exception: {e}"
    print(error_message_on_load)
except Exception as ex_create:
    error_message_on_load = f"PYTHON: Critical Error: Calling create_app from g4f.api failed. Exception: {ex_create}"
    print(error_message_on_load)

if not app:
    app = FastAPI()
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    async def fallback_route(response_obj: Response, path_name: str = None):
        
        print(f"--- LOG 3 (FALLBACK): Python fallback route hit! Error: {error_message_on_load} ---")
        response_obj.status_code = 500
        return {"error": error_message_on_load or "g4f FastAPI application could not be loaded. Python backend is misconfigured."}
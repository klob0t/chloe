# from fastapi import FastAPI, Response # Import FastAPI for the fallback type hint and Response

# # Initialize 'app' to a fallback to handle potential import errors gracefully during Vercel build/runtime
# app = None
# error_message_on_load = "g4f.api.create_app function not successfully called." # Default error

# try:
#     import g4f
#     import g4f.debug
#     g4f.debug.logging = True
#     from g4f.api import create_app
    
#     # Call the function to get the actual FastAPI application instance
#     # Vercel expects this instance to be named 'app' (lowercase) at the module level.
#     app = create_app() 
#     print("PYTHON: Successfully called create_app() from g4f.api")

#     if not app or not hasattr(app, "routes"): # Basic check if it looks like a FastAPI app
#         error_message_on_load = "create_app did not return a valid FastAPI app instance."
#         raise ImportError(error_message_on_load)
    
#     error_message_on_load = None # Clear error if successful

# except ImportError as e:
#     error_message_on_load = f"PYTHON: Critical Error: Could not import 'create_app' from g4f.api or it failed. Exception: {e}"
#     print(error_message_on_load)
# except Exception as ex_create:
#     error_message_on_load = f"PYTHON: Critical Error: Calling create_app from g4f.api failed. Exception: {ex_create}"
#     print(error_message_on_load)

# # If 'app' could not be initialized from g4f, create a dummy fallback app
# # This allows Vercel to deploy the function, but it will return an error indicating the issue.
# if not app:
#     app = FastAPI()
#     @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
#     async def fallback_route(response_obj: Response, path_name: str = None): # Renamed 'response' to 'response_obj'
#         print(f"PYTHON: Fallback route hit for path: {path_name}. Error during g4f app load: {error_message_on_load}")
#         response_obj.status_code = 500
#         return {"error": error_message_on_load or "g4f FastAPI application could not be loaded. Python backend is misconfigured."}

# # Vercel's Python runtime will automatically detect and serve this 'app' instance
# # as it's a recognized ASGI application (FastAPI is an ASGI app).



# api/index.py (or your main python file in the /api directory)

from fastapi import FastAPI, Response, Request # Import Request
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

    # --- vv NEW LOGGING MIDDLEWARE START vv ---
    # This function will run for EVERY request that hits the Python backend.
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        # This is LOG #3 from our debugging plan.
        print(f"--- LOG 3: Python backend was successfully reached! Path: {request.url.path} ---")
        response = await call_next(request)
        return response
    # --- ^^ NEW LOGGING MIDDLEWARE END ^^ ---

    # Define the list of allowed origins
    allowed_origins = [
        "https://www.chloe.16-b.it",
        "http://localhost:3000",
    ]
    vercel_url = os.environ.get('VERCEL_URL')
    if vercel_url:
        allowed_origins.append(f"https://{vercel_url}")

    # Add the CORS middleware to your FastAPI app
    # Using the "Nuclear Option" for debugging as discussed
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins, # TEMPORARY: Allow all origins for debugging
        allow_credentials=True,
        allow_methods=["*"], # Allows all methods
        allow_headers=["*"], # Allows all headers
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
        # Also good to have a log here in case the app fails to load
        print(f"--- LOG 3 (FALLBACK): Python fallback route hit! Error: {error_message_on_load} ---")
        response_obj.status_code = 500
        return {"error": error_message_on_load or "g4f FastAPI application could not be loaded. Python backend is misconfigured."}
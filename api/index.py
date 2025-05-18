from fastapi import FastAPI, Response # Import FastAPI for the fallback type hint and Response

# Initialize 'app' to a fallback to handle potential import errors gracefully during Vercel build/runtime
app = None
error_message_on_load = "g4f.api.create_app function not successfully called." # Default error

try:
    import g4f
    import g4f.debug
    g4f.debug.logging = True
    from g4f.api import create_app
    
    # Call the function to get the actual FastAPI application instance
    # Vercel expects this instance to be named 'app' (lowercase) at the module level.
    app = create_app() 
    print("PYTHON: Successfully called create_app() from g4f.api")

    if not app or not hasattr(app, "routes"): # Basic check if it looks like a FastAPI app
        error_message_on_load = "create_app did not return a valid FastAPI app instance."
        raise ImportError(error_message_on_load)
    
    error_message_on_load = None # Clear error if successful

except ImportError as e:
    error_message_on_load = f"PYTHON: Critical Error: Could not import 'create_app' from g4f.api or it failed. Exception: {e}"
    print(error_message_on_load)
except Exception as ex_create:
    error_message_on_load = f"PYTHON: Critical Error: Calling create_app from g4f.api failed. Exception: {ex_create}"
    print(error_message_on_load)

# If 'app' could not be initialized from g4f, create a dummy fallback app
# This allows Vercel to deploy the function, but it will return an error indicating the issue.
if not app:
    app = FastAPI()
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    async def fallback_route(response_obj: Response, path_name: str = None): # Renamed 'response' to 'response_obj'
        print(f"PYTHON: Fallback route hit for path: {path_name}. Error during g4f app load: {error_message_on_load}")
        response_obj.status_code = 500
        return {"error": error_message_on_load or "g4f FastAPI application could not be loaded. Python backend is misconfigured."}

# Vercel's Python runtime will automatically detect and serve this 'app' instance
# as it's a recognized ASGI application (FastAPI is an ASGI app).
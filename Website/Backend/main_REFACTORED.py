from Website.Backend import create_app
import os


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_ENV") != "production"
    
    if debug_mode:
        print("WARNING: Running in DEBUG mode. Do NOT use in production!")
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug_mode,
        threaded=True
    )

from flask import Flask

def creates_app():
    app = Flask(__name__)
    app.config['SECRETE KEY'] = 'Uknown'

    from .views import views

    from .auth import auth

    app.register_blueprint(views,url_prefix='/')
    app.register_blueprint(auth,url_prefix='/')

    return app
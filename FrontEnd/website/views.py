from flask import Blueprint, render_template
import requests

 
views = Blueprint('views',__name__)

#Creates another page or route, return renders the "fileName.html" 
@views.route('/')
def HomePage():
    return render_template("home.html")

@views.route('/inventory')
def inventory_page():
    response = requests.get('http://127.0.0.1:6969/Getinventory')
    print(response.text)
    payload=response.text
    return render_template("inventory.html",response=response.text,payload=payload)





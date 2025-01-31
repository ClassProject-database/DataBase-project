from flask import Blueprint, render_template


 
views = Blueprint('views',__name__)

#Creates another page or route, return renders the "fileName.html" 
@views.route('/')
def HomePage():
    return render_template("home.html")

@views.route('/inventory')
def inventory_page():
     return render_template("inventory.html")





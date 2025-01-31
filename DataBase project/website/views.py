from flask import Blueprint, render_template


 
views = Blueprint('views',__name__)


@views.route('/')
def HomePage():
    return render_template("home.html")

@views.route('/inventory')
def inventory_button():
     return render_template("inventory.html")





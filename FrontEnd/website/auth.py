from flask import Blueprint, render_template

 
auth=Blueprint('auth',__name__)

#Creates another page or route, return renders the "fileName.html" 
@auth.route('/login')
def login():
    return render_template('login.html')

@auth.route('/logout')
def logout():
    return render_template("logout.html")

@auth.route('/signUp')
def signUp():
    return render_template("signUp.html")

@auth.route('/UserCart')
def Cart():
    return render_template("UserCart.html")
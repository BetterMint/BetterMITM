"""
Host a WSGI app in mitmproxy.

This example shows how to graft a WSGI app onto mitmproxy. In this
instance, we're using the Flask framework (http://flask.pocoo.org/) to expose
a single simplest-possible page.
"""

from flask import Flask

from mitmproxy.addons import asgiapp

app = Flask("proxapp")


@app.route("/")
def hello_world() -> str:
    return "Hello World!"


addons = [


    asgiapp.WSGIApp(app, "example.com", 80),




]
